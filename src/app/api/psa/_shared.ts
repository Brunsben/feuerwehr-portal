import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ausruestungstypen,
  ausruestungstuecke,
  ausgaben,
  pruefungen,
  waesche,
  normen,
  changelog,
  schadensdokumentation,
  kameraden,
} from "@/lib/db/schema";
import { getPsaUser, canEdit } from "@/lib/psa-auth";
import { asc, eq, and, desc } from "drizzle-orm";

// Re-export für einzelne Routen
export {
  db,
  ausruestungstypen,
  ausruestungstuecke,
  ausgaben,
  pruefungen,
  waesche,
  normen,
  changelog,
  schadensdokumentation,
  kameraden,
  getPsaUser,
  canEdit,
  asc,
  eq,
  and,
  desc,
  NextRequest,
  NextResponse,
};

/** Changelog-Eintrag schreiben */
export async function logChange(
  tabelle: string,
  aktion: "Erstellt" | "Bearbeitet" | "Gelöscht",
  details: string,
  benutzerName: string,
) {
  await db.insert(changelog).values({
    tabelle,
    aktion,
    details,
    benutzer: benutzerName,
  });
}
