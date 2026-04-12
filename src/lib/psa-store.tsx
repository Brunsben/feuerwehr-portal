"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import type {
  Kamerad,
  Ausruestungstyp,
  Ausruestungstueck,
  Ausgabe,
  Pruefung,
  Waesche,
  Norm,
  ChangelogEntry,
  Schaden,
  Warnung,
  PsaStats,
} from "./psa-types";
import { GROESSE_KAT_MAP } from "./psa-types";

// ── Helpers ────────────────────────────────────────────────────────────────

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/psa/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API ${res.status}`);
  }
  return res.json();
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ── Context Interface ──────────────────────────────────────────────────────

interface PsaStore {
  // Data
  kameraden: Kamerad[];
  typen: Ausruestungstyp[];
  ausruestung: Ausruestungstueck[];
  ausgaben: Ausgabe[];
  pruefungen: Pruefung[];
  waescheList: Waesche[];
  normen: Norm[];
  changelog: ChangelogEntry[];
  schaeden: Schaden[];

  // Computed
  stats: PsaStats;
  warnungen: Warnung[];
  loading: boolean;

  // CRUD
  reload: () => Promise<void>;
  saveTyp: (data: Partial<Ausruestungstyp>) => Promise<Ausruestungstyp>;
  deleteTyp: (id: number) => Promise<void>;
  saveAusruestung: (
    data: Partial<Ausruestungstueck>,
  ) => Promise<Ausruestungstueck>;
  deleteAusruestung: (id: number) => Promise<void>;
  patchAusruestung: (
    id: number,
    data: Partial<Ausruestungstueck>,
  ) => Promise<Ausruestungstueck>;
  saveAusgabe: (data: Partial<Ausgabe>) => Promise<Ausgabe>;
  patchAusgabe: (id: number, data: Partial<Ausgabe>) => Promise<Ausgabe>;
  savePruefung: (data: Partial<Pruefung>) => Promise<Pruefung>;
  saveWaesche: (data: Partial<Waesche>) => Promise<Waesche>;
  saveNorm: (data: Partial<Norm>) => Promise<Norm>;
  deleteNorm: (id: number) => Promise<void>;
  saveSchaden: (data: Partial<Schaden>) => Promise<Schaden>;
  deleteSchaden: (id: number) => Promise<void>;
  batchAction: (
    action: "pruefung" | "waesche",
    ids: number[],
    data: Record<string, string>,
  ) => Promise<void>;
}

const PsaContext = createContext<PsaStore | null>(null);

export function usePsa() {
  const ctx = useContext(PsaContext);
  if (!ctx) throw new Error("usePsa must be within PsaProvider");
  return ctx;
}

// ── Provider ───────────────────────────────────────────────────────────────

export function PsaProvider({ children }: { children: ReactNode }) {
  const [kameraden, setKameraden] = useState<Kamerad[]>([]);
  const [typen, setTypen] = useState<Ausruestungstyp[]>([]);
  const [ausruestung, setAusruestung] = useState<Ausruestungstueck[]>([]);
  const [ausgaben, setAusgaben] = useState<Ausgabe[]>([]);
  const [pruefungen, setPruefungen] = useState<Pruefung[]>([]);
  const [waescheList, setWaescheList] = useState<Waesche[]>([]);
  const [normen, setNormen] = useState<Norm[]>([]);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [schaeden, setSchaeden] = useState<Schaden[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [kam, typ, aus, ag, pr, wa, no, cl, sc] = await Promise.all([
        api<Kamerad[]>("../kameraden"),
        api<Ausruestungstyp[]>("typen"),
        api<Ausruestungstueck[]>("ausruestung"),
        api<Ausgabe[]>("ausgaben"),
        api<Pruefung[]>("pruefungen"),
        api<Waesche[]>("waesche"),
        api<Norm[]>("normen"),
        api<ChangelogEntry[]>("changelog").catch(() => []),
        api<Schaden[]>("schaeden"),
      ]);
      setKameraden(kam);
      setTypen(typ);
      setAusruestung(aus);
      setAusgaben(ag);
      setPruefungen(pr);
      setWaescheList(wa);
      setNormen(no);
      setChangelog(cl);
      setSchaeden(sc);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // ── Computed: Stats ────────────────────────────────────────────────────

  const stats = useMemo<PsaStats>(() => {
    const today = new Date();
    const in30 = addDays(today, 30);
    return {
      kameraden: kameraden.filter((k) => k.aktiv).length,
      ausruestung: ausruestung.length,
      ausgegeben: ausruestung.filter((a) => a.status === "Ausgegeben").length,
      pruefungFaellig: ausruestung.filter(
        (a) => a.naechstePruefung && new Date(a.naechstePruefung) <= in30,
      ).length,
    };
  }, [kameraden, ausruestung]);

  // ── Computed: Warnungen ────────────────────────────────────────────────

  const warnungen = useMemo<Warnung[]>(() => {
    const today = new Date();
    const in30 = addDays(today, 30);
    const in180 = addDays(today, 180);
    const ws: Warnung[] = [];

    // Build waescheCount map
    const waescheCount = new Map<number, number>();
    for (const w of waescheList) {
      if (w.ausruestungstueckId) {
        waescheCount.set(
          w.ausruestungstueckId,
          (waescheCount.get(w.ausruestungstueckId) || 0) + 1,
        );
      }
    }

    // Typ-Map für Limits
    const typMap = new Map(typen.map((t) => [t.bezeichnung, t]));

    // Kamerad-Map für Größenvergleich
    const kamMap = new Map(kameraden.map((k) => [k.id, k]));

    for (const a of ausruestung) {
      const typ = a.ausruestungstyp ? typMap.get(a.ausruestungstyp) : null;
      const label =
        `${a.ausruestungstyp || "?"} ${a.seriennummer || ""}`.trim();

      // 1) Prüfung überfällig
      if (a.naechstePruefung) {
        const np = new Date(a.naechstePruefung);
        if (np < today) {
          ws.push({
            prio: "rot",
            text: `Prüfung überfällig: ${label}`,
            ausruestungstueck: a,
            typ: a.ausruestungstyp || undefined,
          });
        } else if (np <= in30) {
          ws.push({
            prio: "orange",
            text: `Prüfung bald fällig: ${label}`,
            ausruestungstueck: a,
            typ: a.ausruestungstyp || undefined,
          });
        }
      }

      // 2) Lebensende
      if (a.lebensendeDatum) {
        const le = new Date(a.lebensendeDatum);
        if (le < today) {
          ws.push({
            prio: "rot",
            text: `Lebensende überschritten: ${label}`,
            ausruestungstueck: a,
            typ: a.ausruestungstyp || undefined,
          });
        } else if (le <= in180) {
          ws.push({
            prio: "gelb",
            text: `Lebensende in < 6 Monaten: ${label}`,
            ausruestungstueck: a,
            typ: a.ausruestungstyp || undefined,
          });
        }
      }

      // 3) Wäsche-Limit
      if (typ?.maxWaeschen) {
        const count = waescheCount.get(a.id) || 0;
        if (count >= typ.maxWaeschen) {
          ws.push({
            prio: "rot",
            text: `Wasch-Limit erreicht (${count}/${typ.maxWaeschen}): ${label}`,
            ausruestungstueck: a,
            typ: a.ausruestungstyp || undefined,
          });
        } else if (count / typ.maxWaeschen >= 0.9) {
          ws.push({
            prio: "orange",
            text: `Wasch-Limit fast erreicht (${count}/${typ.maxWaeschen}): ${label}`,
            ausruestungstueck: a,
            typ: a.ausruestungstyp || undefined,
          });
        }
      }

      // 4) Größen-Abweichung
      if (a.status === "Ausgegeben" && a.kameradId && typ?.typ) {
        const gm = GROESSE_KAT_MAP[typ.typ];
        if (gm) {
          const kam = kamMap.get(a.kameradId);
          if (kam) {
            const kamGroesse = kam[gm.field] as string | null;
            if (kamGroesse && a.groesse && kamGroesse !== a.groesse) {
              ws.push({
                prio: "gelb",
                text: `Größen-Abweichung ${gm.label}: ${label} (${a.groesse} ≠ ${kamGroesse})`,
                ausruestungstueck: a,
                typ: a.ausruestungstyp || undefined,
              });
            }
          }
        }
      }
    }

    // Sortieren: rot=0, orange=1, gelb=2
    const prioOrder = { rot: 0, orange: 1, gelb: 2 };
    ws.sort((a, b) => prioOrder[a.prio] - prioOrder[b.prio]);
    return ws;
  }, [ausruestung, typen, kameraden, waescheList]);

  // ── CRUD functions ─────────────────────────────────────────────────────

  const saveTyp = useCallback(
    async (data: Partial<Ausruestungstyp>) => {
      let result: Ausruestungstyp;
      if (data.id) {
        result = await api<Ausruestungstyp>(`typen/${data.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      } else {
        result = await api<Ausruestungstyp>("typen", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
      await reload();
      return result;
    },
    [reload],
  );

  const deleteTyp = useCallback(
    async (id: number) => {
      await api(`typen/${id}`, { method: "DELETE" });
      await reload();
    },
    [reload],
  );

  const saveAusruestung = useCallback(
    async (data: Partial<Ausruestungstueck>) => {
      let result: Ausruestungstueck;
      if (data.id) {
        result = await api<Ausruestungstueck>(`ausruestung/${data.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      } else {
        result = await api<Ausruestungstueck>("ausruestung", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
      await reload();
      return result;
    },
    [reload],
  );

  const deleteAusruestung = useCallback(
    async (id: number) => {
      await api(`ausruestung/${id}`, { method: "DELETE" });
      await reload();
    },
    [reload],
  );

  const patchAusruestung = useCallback(
    async (id: number, data: Partial<Ausruestungstueck>) => {
      const result = await api<Ausruestungstueck>(`ausruestung/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      await reload();
      return result;
    },
    [reload],
  );

  const saveAusgabe = useCallback(
    async (data: Partial<Ausgabe>) => {
      const result = await api<Ausgabe>("ausgaben", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await reload();
      return result;
    },
    [reload],
  );

  const patchAusgabe = useCallback(
    async (id: number, data: Partial<Ausgabe>) => {
      const result = await api<Ausgabe>(`ausgaben/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      await reload();
      return result;
    },
    [reload],
  );

  const savePruefung = useCallback(
    async (data: Partial<Pruefung>) => {
      const result = await api<Pruefung>("pruefungen", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await reload();
      return result;
    },
    [reload],
  );

  const saveWaesche = useCallback(
    async (data: Partial<Waesche>) => {
      const result = await api<Waesche>("waesche", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await reload();
      return result;
    },
    [reload],
  );

  const saveNorm = useCallback(
    async (data: Partial<Norm>) => {
      let result: Norm;
      if (data.id) {
        result = await api<Norm>(`normen/${data.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      } else {
        result = await api<Norm>("normen", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
      await reload();
      return result;
    },
    [reload],
  );

  const deleteNorm = useCallback(
    async (id: number) => {
      await api(`normen/${id}`, { method: "DELETE" });
      await reload();
    },
    [reload],
  );

  const saveSchaden = useCallback(
    async (data: Partial<Schaden>) => {
      const result = await api<Schaden>("schaeden", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await reload();
      return result;
    },
    [reload],
  );

  const deleteSchaden = useCallback(
    async (id: number) => {
      await api(`schaeden/${id}`, { method: "DELETE" });
      await reload();
    },
    [reload],
  );

  const batchAction = useCallback(
    async (
      action: "pruefung" | "waesche",
      ids: number[],
      data: Record<string, string>,
    ) => {
      await api("batch", {
        method: "POST",
        body: JSON.stringify({ action, ids, data }),
      });
      await reload();
    },
    [reload],
  );

  const value: PsaStore = {
    kameraden,
    typen,
    ausruestung,
    ausgaben,
    pruefungen,
    waescheList,
    normen,
    changelog,
    schaeden,
    stats,
    warnungen,
    loading,
    reload,
    saveTyp,
    deleteTyp,
    saveAusruestung,
    deleteAusruestung,
    patchAusruestung,
    saveAusgabe,
    patchAusgabe,
    savePruefung,
    saveWaesche,
    saveNorm,
    deleteNorm,
    saveSchaden,
    deleteSchaden,
    batchAction,
  };

  return <PsaContext.Provider value={value}>{children}</PsaContext.Provider>;
}
