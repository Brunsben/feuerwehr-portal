<template>
  <div>
    <!-- ── Header-Leiste ──────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mitgliederverwaltung</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ filteredKameraden.length }} von {{ kameraden.length }} Mitgliedern
        </p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Suche -->
        <div class="relative flex-1 sm:flex-initial">
          <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input v-model="search" type="text" placeholder="Name suchen…"
            class="w-full sm:w-64 pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
        </div>
        <!-- Nur aktive -->
        <label class="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
          <input v-model="nurAktive" type="checkbox" class="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500" />
          Nur aktive
        </label>
        <!-- Neu anlegen (nur Admin) -->
        <button v-if="isAdmin" @click="openCreate"
          class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap">
          <i class="ph ph-plus-circle text-lg"></i>
          Neu
        </button>
      </div>
    </div>

    <!-- ── Ladezustand ────────────────────────────────────────── -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <i class="ph ph-spinner animate-spin text-3xl text-gray-400"></i>
    </div>

    <!-- ── Fehler ─────────────────────────────────────────────── -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
      <i class="ph ph-warning-circle text-3xl text-red-500 mb-2"></i>
      <p class="text-red-700 dark:text-red-300 font-medium">{{ error }}</p>
      <button @click="loadKameraden" class="mt-3 text-sm text-red-600 dark:text-red-400 hover:underline">Erneut versuchen</button>
    </div>

    <!-- ── Tabelle (Desktop) ──────────────────────────────────── -->
    <div v-else-if="filteredKameraden.length > 0" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <!-- Desktop-Tabelle -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th class="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Name</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Dienstgrad</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Email</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Personal-Nr.</th>
              <th class="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Apps</th>
              <th class="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
              <th v-if="isAdmin" class="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="k in filteredKameraden" :key="k.id"
              class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900 dark:text-white">
                  {{ k.Vorname }} {{ k.Name }}
                  <i v-if="isAdmin && hasLogin(k.id)" class="ph ph-key text-xs text-gray-400 ml-1" title="Hat Login-Account"></i>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ k.Dienstgrad || '—' }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ k.Email || '—' }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ k.Personalnummer || '—' }}</td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <span v-if="k.psa_rolle" class="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" title="PSA">PSA</span>
                  <span v-if="k.food_rolle" class="px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" title="FoodBot">Food</span>
                  <span v-if="k.fk_rolle" class="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" title="FK">FK</span>
                  <span v-if="!k.psa_rolle && !k.food_rolle && !k.fk_rolle" class="text-xs text-gray-400">—</span>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <span :class="k.Aktiv
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
                  class="inline-block px-2 py-0.5 rounded-full text-xs font-medium">
                  {{ k.Aktiv ? 'Aktiv' : 'Inaktiv' }}
                </span>
              </td>
              <td v-if="isAdmin" class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="openEdit(k)" title="Bearbeiten"
                    class="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <i class="ph ph-pencil-simple text-lg"></i>
                  </button>
                  <button @click="confirmDelete(k)" title="Löschen"
                    class="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                    <i class="ph ph-trash text-lg"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile-Karten -->
      <div class="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
        <div v-for="k in filteredKameraden" :key="'m-'+k.id"
          class="p-4 flex items-center justify-between">
          <div class="min-w-0 flex-1">
            <div class="font-medium text-gray-900 dark:text-white truncate">
              {{ k.Vorname }} {{ k.Name }}
              <i v-if="isAdmin && hasLogin(k.id)" class="ph ph-key text-xs text-gray-400 ml-1" title="Hat Login-Account"></i>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ k.Dienstgrad || 'Kein Dienstgrad' }}
              <span v-if="k.Personalnummer" class="ml-2">· Nr. {{ k.Personalnummer }}</span>
            </div>
            <div v-if="k.psa_rolle || k.food_rolle || k.fk_rolle" class="flex items-center gap-1 mt-1">
              <span v-if="k.psa_rolle" class="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">PSA</span>
              <span v-if="k.food_rolle" class="px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Food</span>
              <span v-if="k.fk_rolle" class="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">FK</span>
            </div>
          </div>
          <div class="flex items-center gap-2 ml-3">
            <span :class="k.Aktiv
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
              class="px-2 py-0.5 rounded-full text-xs font-medium">
              {{ k.Aktiv ? 'Aktiv' : 'Inaktiv' }}
            </span>
            <button v-if="isAdmin" @click="openEdit(k)"
              class="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
              <i class="ph ph-pencil-simple"></i>
            </button>
            <button v-if="isAdmin" @click="confirmDelete(k)"
              class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400">
              <i class="ph ph-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Keine Ergebnisse ───────────────────────────────────── -->
    <div v-else class="text-center py-16">
      <i class="ph ph-users-three text-5xl text-gray-300 dark:text-gray-600 mb-4"></i>
      <p class="text-gray-500 dark:text-gray-400">
        {{ search ? 'Keine Mitglieder gefunden.' : 'Noch keine Mitglieder angelegt.' }}
      </p>
    </div>

    <!-- ── Modal: Erstellen / Bearbeiten ──────────────────────── -->
    <Teleport to="body">
      <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @mousedown.self="closeForm">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
        <!-- Modal -->
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between z-10">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">
              {{ editId ? 'Mitglied bearbeiten' : 'Neues Mitglied' }}
            </h3>
            <button @click="closeForm"
              class="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              <i class="ph ph-x text-xl"></i>
            </button>
          </div>

          <!-- Formular-Body -->
          <div class="px-6 py-5 grid gap-5">
            <!-- Persönliche Daten -->
            <fieldset>
              <legend class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Persönliche Daten</legend>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vorname *</label>
                  <input v-model="form.Vorname" type="text"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                  <input v-model="form.Name" type="text"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dienstgrad</label>
                  <select v-model="form.Dienstgrad"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                    <option value="">— Kein Dienstgrad —</option>
                    <option v-for="d in dienstgrade" :key="d" :value="d">{{ d }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input v-model="form.Email" type="email"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Personalnummer</label>
                  <input v-model="form.Personalnummer" type="text" placeholder="z.B. 1234"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">KartenID (RFID)</label>
                  <input v-model="form.KartenID" type="text" placeholder="z.B. A1B2C3"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                </div>
              </div>
            </fieldset>

            <!-- Kleidergrößen -->
            <fieldset>
              <legend class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Kleidergrößen</legend>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jacke</label>
                  <input v-model="form.Jacke_Groesse" type="text" placeholder="z.B. 52"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hose</label>
                  <input v-model="form.Hose_Groesse" type="text" placeholder="z.B. 52"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stiefel (EU)</label>
                  <input v-model="form.Stiefel_Groesse" type="number" placeholder="z.B. 43"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Handschuh</label>
                  <input v-model="form.Handschuh_Groesse" type="text" placeholder="z.B. 9"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hemd</label>
                  <input v-model="form.Hemd_Groesse" type="text" placeholder="z.B. 40/41"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Poloshirt</label>
                  <input v-model="form.Poloshirt_Groesse" type="text" placeholder="z.B. L"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fleece/Softshell</label>
                  <input v-model="form.Fleece_Groesse" type="text" placeholder="z.B. L"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                </div>
              </div>
            </fieldset>

            <!-- Aktiv-Toggle -->
            <label class="flex items-center gap-3 cursor-pointer select-none">
              <input v-model="form.Aktiv" type="checkbox"
                class="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500 w-5 h-5" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Mitglied ist aktiv</span>
            </label>

            <!-- App-Berechtigungen -->
            <fieldset>
              <legend class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">App-Berechtigungen</legend>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <i class="ph ph-shield-check text-red-500 mr-1"></i>PSA-Verwaltung
                  </label>
                  <select v-model="form.psa_rolle"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                    <option value="">Kein Zugriff</option>
                    <option v-for="r in psaRollen" :key="r" :value="r">{{ r }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <i class="ph ph-fork-knife text-amber-500 mr-1"></i>Essensbestellung
                  </label>
                  <select v-model="form.food_rolle"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                    <option value="">Kein Zugriff</option>
                    <option v-for="r in foodRollen" :key="r" :value="r">{{ r }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <i class="ph ph-car text-blue-500 mr-1"></i>Führerscheinkontrolle
                  </label>
                  <select v-model="form.fk_rolle"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                    <option value="">Kein Zugriff</option>
                    <option v-for="r in fkRollen" :key="r" :value="r">{{ r }}</option>
                  </select>
                </div>
              </div>
            </fieldset>

            <!-- Login-Account -->
            <fieldset>
              <legend class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Login-Account</legend>
              <div v-if="linkedBenutzer" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Benutzername</label>
                    <input v-model="benutzerForm.Benutzername" type="text" placeholder="max.mustermann"
                      class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {{ linkedBenutzer.id ? 'Neues Passwort (leer = unverändert)' : 'Passwort *' }}
                    </label>
                    <input v-model="benutzerForm.PIN" type="password" placeholder="••••••"
                      class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Portal-Rolle</label>
                    <select v-model="benutzerForm.Rolle"
                      class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                      <option value="Admin">Admin</option>
                      <option value="Gerätewart">Gerätewart</option>
                      <option value="Maschinist">Maschinist</option>
                      <option value="User">User</option>
                    </select>
                  </div>
                  <div class="flex items-end">
                    <label class="flex items-center gap-2 cursor-pointer select-none pb-2">
                      <input v-model="benutzerForm.Aktiv" type="checkbox"
                        class="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500 w-5 h-5" />
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Account aktiv</span>
                    </label>
                  </div>
                </div>
                <button v-if="linkedBenutzer.id" @click="removeBenutzer" type="button"
                  class="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium">
                  <i class="ph ph-trash mr-1"></i>Login-Account entfernen
                </button>
              </div>
              <div v-else class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 rounded-lg px-4 py-3">
                <p class="text-sm text-gray-500 dark:text-gray-400">Kein Login-Account verknüpft</p>
                <button @click="enableBenutzer" type="button"
                  class="text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                  <i class="ph ph-user-plus mr-1"></i>Account anlegen
                </button>
              </div>
            </fieldset>

            <!-- Fehler im Formular -->
            <div v-if="formError" class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {{ formError }}
            </div>
          </div>

          <!-- Footer -->
          <div class="sticky bottom-0 bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
            <button @click="closeForm"
              class="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              Abbrechen
            </button>
            <button @click="saveKamerad" :disabled="saving"
              class="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
              <i v-if="saving" class="ph ph-spinner animate-spin"></i>
              <i v-else class="ph ph-check"></i>
              {{ editId ? 'Speichern' : 'Anlegen' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Modal: Löschen bestätigen ──────────────────────────── -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @mousedown.self="deleteTarget = null">
        <div class="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-sm p-6">
          <div class="text-center">
            <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <i class="ph ph-warning text-2xl text-red-600 dark:text-red-400"></i>
            </div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Mitglied löschen?</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              <strong>{{ deleteTarget.Vorname }} {{ deleteTarget.Name }}</strong> wird unwiderruflich gelöscht.
            </p>
            <div class="flex items-center justify-center gap-3">
              <button @click="deleteTarget = null"
                class="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                Abbrechen
              </button>
              <button @click="doDelete" :disabled="saving"
                class="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
                <i v-if="saving" class="ph ph-spinner animate-spin"></i>
                Löschen
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Toast-Nachricht ────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="toast" class="fixed bottom-6 right-6 z-50 max-w-sm">
          <div :class="toast.type === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-green-600 text-white'"
            class="px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
            <i :class="toast.type === 'error' ? 'ph ph-warning-circle' : 'ph ph-check-circle'" class="text-lg"></i>
            {{ toast.message }}
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  isAdmin: boolean
}>()

// ── Typen ───────────────────────────────────────────────────────────────
interface Kamerad {
  id: number
  Vorname: string | null
  Name: string | null
  Dienstgrad: string | null
  Email: string | null
  Personalnummer: string | null
  KartenID: string | null
  Jacke_Groesse: string | null
  Hose_Groesse: string | null
  Stiefel_Groesse: string | number | null
  Handschuh_Groesse: string | null
  Hemd_Groesse: string | null
  Poloshirt_Groesse: string | null
  Fleece_Groesse: string | null
  Aktiv: boolean
  psa_rolle: string | null
  food_rolle: string | null
  fk_rolle: string | null
}

type KameradForm = Omit<Kamerad, 'id'>

interface Benutzer {
  id: number
  Benutzername: string
  Rolle: string
  KameradId: number | null
  Aktiv: boolean
}

interface BenutzerForm {
  Benutzername: string
  PIN: string
  Rolle: string
  Aktiv: boolean
}

// ── Dienstgrade (FwVO Niedersachsen) ────────────────────────────────────
const dienstgrade = [
  'Feuerwehrmannanwärter/in',
  'Feuerwehrmann/frau',
  'Oberfeuerwehrmann/frau',
  'Hauptfeuerwehrmann/frau',
  'Löschmeister/in',
  'Oberlöschmeister/in',
  'Hauptlöschmeister/in',
  'Brandmeister/in',
  'Oberbrandmeister/in',
  'Hauptbrandmeister/in',
  'Erste/r Hauptbrandmeister/in',
  'Gemeindebrandmeister/in',
  'Stadtbrandmeister/in',
  'Abschnittsbrandmeister/in',
  'Kreisbrandmeister/in',
]

const psaRollen = ['Admin', 'Verwalter', 'Nur lesen']
const foodRollen = ['Admin', 'User']
const fkRollen = ['Admin', 'Prüfer', 'Mitglied']

// ── PostgREST API ───────────────────────────────────────────────────────
const API = '/psa/api'

// ── State ───────────────────────────────────────────────────────────────
const kameraden = ref<Kamerad[]>([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const nurAktive = ref(true)

const showForm = ref(false)
const editId = ref<number | null>(null)
const saving = ref(false)
const formError = ref('')

const deleteTarget = ref<Kamerad | null>(null)

const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)
let toastTimer: ReturnType<typeof setTimeout>

function emptyForm(): KameradForm {
  return {
    Vorname: '', Name: '', Dienstgrad: '', Email: '',
    Personalnummer: '', KartenID: '',
    Jacke_Groesse: '', Hose_Groesse: '', Stiefel_Groesse: '',
    Handschuh_Groesse: '', Hemd_Groesse: '', Poloshirt_Groesse: '', Fleece_Groesse: '',
    Aktiv: true,
    psa_rolle: '', food_rolle: '', fk_rolle: '',
  }
}
const form = ref<KameradForm>(emptyForm())

// ── Benutzer-State ──────────────────────────────────────────────────────
const benutzerList = ref<Benutzer[]>([])
const benutzerForm = ref<BenutzerForm>({ Benutzername: '', PIN: '', Rolle: 'User', Aktiv: true })
const benutzerEnabled = ref(false)   // true = Benutzer-Section im Form sichtbar
const benutzerExistingId = ref<number | null>(null)  // Id des verknüpften Benutzer-Datensatzes

const linkedBenutzer = computed(() => {
  if (!showForm.value || !benutzerEnabled.value) return null
  return { id: benutzerExistingId.value }
})

function enableBenutzer() {
  benutzerForm.value = { Benutzername: '', PIN: '', Rolle: 'User', Aktiv: true }
  benutzerExistingId.value = null
  benutzerEnabled.value = true
}

async function removeBenutzer() {
  if (!benutzerExistingId.value) {
    benutzerEnabled.value = false
    return
  }
  try {
    const res = await fetch(`${API}/Benutzer?id=eq.${benutzerExistingId.value}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    showToast('Login-Account entfernt', 'success')
    benutzerEnabled.value = false
    benutzerExistingId.value = null
    await loadBenutzer()
  } catch (e: any) {
    showToast(`Löschen fehlgeschlagen: ${e.message}`, 'error')
  }
}

async function loadBenutzer() {
  try {
    const res = await fetch('/api/auth/benutzer', { credentials: 'same-origin' })
    if (res.ok) benutzerList.value = await res.json()
  } catch { /* ignorieren, nur Admin kann Benutzer sehen */ }
}

function hasLogin(kameradId: number): boolean {
  return benutzerList.value.some((b: Benutzer) => b.KameradId === kameradId)
}

// ── Computed ────────────────────────────────────────────────────────────
const filteredKameraden = computed(() => {
  let list = kameraden.value
  if (nurAktive.value) list = list.filter((k: Kamerad) => k.Aktiv)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((k: Kamerad) =>
      `${k.Vorname} ${k.Name}`.toLowerCase().includes(q) ||
      (k.Personalnummer && k.Personalnummer.toLowerCase().includes(q))
    )
  }
  return list
})

// ── API-Aufrufe ─────────────────────────────────────────────────────────
async function loadKameraden() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API}/Kameraden?limit=10000&order=Name.asc,Vorname.asc`, {
      credentials: 'same-origin',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    kameraden.value = await res.json()
  } catch (e: any) {
    error.value = `Laden fehlgeschlagen: ${e.message}`
  } finally {
    loading.value = false
  }
}

function buildPayload(): Record<string, unknown> {
  return {
    Vorname:           form.value.Vorname           || null,
    Name:              form.value.Name              || null,
    Dienstgrad:        form.value.Dienstgrad        || null,
    Email:             form.value.Email             || null,
    Personalnummer:    form.value.Personalnummer    || null,
    KartenID:          form.value.KartenID          || null,
    Jacke_Groesse:     form.value.Jacke_Groesse     || null,
    Hose_Groesse:      form.value.Hose_Groesse      || null,
    Stiefel_Groesse:   form.value.Stiefel_Groesse   || null,
    Handschuh_Groesse: form.value.Handschuh_Groesse || null,
    Hemd_Groesse:      form.value.Hemd_Groesse      || null,
    Poloshirt_Groesse: form.value.Poloshirt_Groesse || null,
    Fleece_Groesse:    form.value.Fleece_Groesse    || null,
    Aktiv:             form.value.Aktiv             ?? true,
    psa_rolle:         form.value.psa_rolle         || null,
    food_rolle:        form.value.food_rolle        || null,
    fk_rolle:          form.value.fk_rolle          || null,
  }
}

async function saveKamerad() {
  formError.value = ''
  if (!form.value.Vorname?.trim() || !form.value.Name?.trim()) {
    formError.value = '"Vorname" und "Name" sind Pflichtfelder.'
    return
  }
  if (benutzerEnabled.value && !benutzerExistingId.value && !benutzerForm.value.PIN) {
    formError.value = 'Bitte ein Passwort für den neuen Login-Account vergeben.'
    return
  }
  if (benutzerEnabled.value && !benutzerForm.value.Benutzername?.trim()) {
    formError.value = 'Bitte einen Benutzernamen eingeben.'
    return
  }
  saving.value = true
  try {
    const payload = buildPayload()
    const isEdit = editId.value !== null
    const url = isEdit
      ? `${API}/Kameraden?id=eq.${editId.value}`
      : `${API}/Kameraden`
    const res = await fetch(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string; details?: string }
      throw new Error(err.message || err.details || `HTTP ${res.status}`)
    }

    // Kamerad-Id ermitteln (für neue Kameraden aus der Antwort)
    const saved = await res.json() as Kamerad[]
    const kameradId = isEdit ? editId.value! : saved[0]?.id

    // ── Benutzer-Account speichern ──
    if (benutzerEnabled.value && kameradId) {
      const bPayload: Record<string, unknown> = {
        Benutzername: benutzerForm.value.Benutzername.trim(),
        Rolle: benutzerForm.value.Rolle,
        KameradId: kameradId,
        Aktiv: benutzerForm.value.Aktiv,
      }
      if (benutzerForm.value.PIN) {
        bPayload.PIN = benutzerForm.value.PIN
      }
      const bIsEdit = !!benutzerExistingId.value
      const bUrl = bIsEdit
        ? `${API}/Benutzer?id=eq.${benutzerExistingId.value}`
        : `${API}/Benutzer`
      const bRes = await fetch(bUrl, {
        method: bIsEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        credentials: 'same-origin',
        body: JSON.stringify(bPayload),
      })
      if (!bRes.ok) {
        const bErr = await bRes.json().catch(() => ({})) as { message?: string; details?: string }
        throw new Error(`Login-Account: ${bErr.message || bErr.details || `HTTP ${bRes.status}`}`)
      }
    }

    showToast(isEdit ? 'Mitglied aktualisiert' : 'Mitglied angelegt', 'success')
    closeForm()
    await loadKameraden()
    await loadBenutzer()
  } catch (e: any) {
    formError.value = e.message || 'Speichern fehlgeschlagen'
  } finally {
    saving.value = false
  }
}

async function doDelete() {
  if (!deleteTarget.value) return
  saving.value = true
  try {
    const res = await fetch(`${API}/Kameraden?id=eq.${deleteTarget.value.id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    showToast('Mitglied gelöscht', 'success')
    deleteTarget.value = null
    await loadKameraden()
  } catch (e: any) {
    showToast(`Löschen fehlgeschlagen: ${e.message}`, 'error')
  } finally {
    saving.value = false
  }
}

// ── Form-Helfer ─────────────────────────────────────────────────────────
function openCreate() {
  editId.value = null
  form.value = emptyForm()
  formError.value = ''
  benutzerEnabled.value = false
  benutzerExistingId.value = null
  benutzerForm.value = { Benutzername: '', PIN: '', Rolle: 'User', Aktiv: true }
  showForm.value = true
}

function openEdit(k: Kamerad) {
  editId.value = k.id
  form.value = {
    Vorname:           k.Vorname           ?? '',
    Name:              k.Name              ?? '',
    Dienstgrad:        k.Dienstgrad        ?? '',
    Email:             k.Email             ?? '',
    Personalnummer:    k.Personalnummer    ?? '',
    KartenID:          k.KartenID          ?? '',
    Jacke_Groesse:     k.Jacke_Groesse     ?? '',
    Hose_Groesse:      k.Hose_Groesse      ?? '',
    Stiefel_Groesse:   k.Stiefel_Groesse   ?? '',
    Handschuh_Groesse: k.Handschuh_Groesse ?? '',
    Hemd_Groesse:      k.Hemd_Groesse      ?? '',
    Poloshirt_Groesse: k.Poloshirt_Groesse ?? '',
    Fleece_Groesse:    k.Fleece_Groesse    ?? '',
    Aktiv:             k.Aktiv             ?? true,
    psa_rolle:         k.psa_rolle         ?? '',
    food_rolle:        k.food_rolle        ?? '',
    fk_rolle:          k.fk_rolle          ?? '',
  }
  formError.value = ''
  // Verknüpften Benutzer laden
  const linked = benutzerList.value.find((b: Benutzer) => b.KameradId === k.id)
  if (linked) {
    benutzerEnabled.value = true
    benutzerExistingId.value = linked.id
    benutzerForm.value = {
      Benutzername: linked.Benutzername,
      PIN: '',
      Rolle: linked.Rolle,
      Aktiv: linked.Aktiv,
    }
  } else {
    benutzerEnabled.value = false
    benutzerExistingId.value = null
    benutzerForm.value = { Benutzername: '', PIN: '', Rolle: 'User', Aktiv: true }
  }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editId.value = null
  formError.value = ''
  benutzerEnabled.value = false
  benutzerExistingId.value = null
}

function confirmDelete(k: Kamerad) {
  deleteTarget.value = k
}

function showToast(message: string, type: 'success' | 'error') {
  clearTimeout(toastTimer)
  toast.value = { message, type }
  toastTimer = setTimeout(() => { toast.value = null }, 3000)
}

// ── Lifecycle ───────────────────────────────────────────────────────────
onMounted(() => {
  loadKameraden()
  if (props.isAdmin) loadBenutzer()
})
</script>
