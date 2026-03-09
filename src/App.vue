<template>
  <div class="min-h-screen flex flex-col">
    <!-- Login-Screen -->
    <LoginView v-if="!loggedIn" @loggedIn="onLogin" />

    <!-- Portal (nach Login) -->
    <template v-else>
      <!-- ── Header ─────────────────────────────────────────────────── -->
      <header class="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-30">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🔥</span>
            <div>
              <h1 class="font-bold text-gray-900 dark:text-white text-lg leading-tight">{{ config.FEUERWEHR_NAME }}</h1>
              <p class="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide uppercase">Digitales Portal</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- Uhrzeit -->
            <div class="hidden sm:block text-right mr-4">
              <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ time }}</div>
              <div class="text-xs text-gray-400 dark:text-gray-500">{{ date }}</div>
            </div>
            <!-- Angemeldeter User -->
            <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <i class="ph ph-user-circle text-gray-500 dark:text-gray-400 text-lg"></i>
              <div class="text-right">
                <div class="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">{{ currentUser?.Benutzername }}</div>
                <div class="text-xs text-gray-400 dark:text-gray-500 leading-tight">{{ currentUser?.Rolle }}</div>
              </div>
            </div>
            <!-- Dark Mode Toggle -->
            <button @click="toggleDark"
              class="p-2.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              :title="darkMode ? 'Helles Design' : 'Dunkles Design'">
              <i :class="darkMode ? 'ph ph-sun' : 'ph ph-moon'" class="text-xl"></i>
            </button>
            <!-- Logout -->
            <button @click="doLogout"
              class="p-2.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Abmelden">
              <i class="ph ph-sign-out text-xl"></i>
            </button>
          </div>
        </div>
      </header>

      <!-- ── Main Content ───────────────────────────────────────────── -->
      <main class="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <!-- Willkommen -->
        <div class="text-center mb-10">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Willkommen, {{ currentUser?.Benutzername }}
          </h2>
          <p class="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            Wähle eine Anwendung, um loszulegen.
          </p>
        </div>

        <!-- App-Kacheln Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          <a v-for="app in visibleApps" :key="app.id"
            :href="app.path"
            class="app-card group block bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">

            <!-- Farbiger Header-Stripe -->
            <div :class="headerClass(app.color)" class="h-1.5"></div>

            <div class="p-5 sm:p-6">
              <!-- Icon + Status -->
              <div class="flex items-start justify-between mb-4">
                <div :class="iconBgClass(app.color)" class="w-12 h-12 rounded-xl flex items-center justify-center">
                  <i :class="['ph', app.icon, iconTextClass(app.color)]" class="text-2xl"></i>
                </div>
                <div class="flex items-center gap-1.5" :title="statusTitle(app.id)">
                  <span :class="statusDotClass(app.id)" class="w-2.5 h-2.5 rounded-full"></span>
                  <span class="text-xs font-medium" :class="statusTextClass(app.id)">
                    {{ statusLabel(app.id) }}
                  </span>
                </div>
              </div>

              <!-- Name + Beschreibung -->
              <h3 class="font-bold text-gray-900 dark:text-white text-base mb-1.5 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                {{ app.name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {{ app.description }}
              </p>

              <!-- Rolle-Badge + Öffnen-Link -->
              <div class="mt-4 flex items-center justify-between">
                <span v-if="appPermissions[app.id]"
                  class="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  {{ appPermissions[app.id] }}
                </span>
                <div v-else></div>
                <div class="flex items-center gap-1.5 text-sm font-semibold" :class="linkClass(app.color)">
                  Öffnen
                  <i class="ph ph-arrow-right text-base transition-transform group-hover:translate-x-1"></i>
                </div>
              </div>
            </div>
          </a>
        </div>

        <!-- Schnellzugriff-Links -->
        <div v-if="visibleApps.length > 0" class="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
          <h3 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Schnellzugriff</h3>
          <div class="flex flex-wrap gap-3">
            <a v-if="appPermissions['psa']" href="/psa/#warnungen"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-red-200 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-sm">
              <i class="ph ph-warning text-lg text-red-500"></i>
              PSA Warnungen
            </a>
            <a v-if="appPermissions['psa']" href="/psa/#statistiken"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-red-200 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-sm">
              <i class="ph ph-chart-bar text-lg text-blue-500"></i>
              PSA Statistiken
            </a>
            <a v-if="appPermissions['psa']" href="/psa/#kameraden"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-red-200 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-sm">
              <i class="ph ph-users text-lg text-emerald-500"></i>
              Kameraden
            </a>
          </div>
        </div>
      </main>

      <!-- ── Footer ─────────────────────────────────────────────────── -->
      <footer class="py-6 text-center text-xs text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-gray-800">
        <p>{{ config.FEUERWEHR_NAME }} — Digitales Portal</p>
        <p class="mt-1">
          <a href="https://github.com/BenBruns" target="_blank" class="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
            Entwickelt von Benjamin Bruns
          </a>
        </p>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import LoginView from './components/LoginView.vue'

// ── Config ──────────────────────────────────────────────────────────────
const config = window.PORTAL_CONFIG

interface PortalUser {
  Benutzername: string
  Rolle: string
  app_permissions?: Record<string, string>
}

// ── Auth (httpOnly-Cookie-basiert) ───────────────────────────────────────
// JWT wird serverseitig als httpOnly-Cookie verwaltet (nicht im Frontend sichtbar).
// Session-Status wird über /api/auth/me geprüft.
const loggedIn = ref(false)
const currentUser = ref<PortalUser | null>(null)
const appPermissions = ref<Record<string, string>>({})

async function tryRestoreSession() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' })
    if (!res.ok) return
    const user: PortalUser = await res.json()
    currentUser.value = user
    appPermissions.value = user.app_permissions || {}
    loggedIn.value = true
  } catch { /* kein gültiges Cookie → bleibt ausgeloggt */ }
}

function onLogin(user: PortalUser) {
  currentUser.value = user
  appPermissions.value = user.app_permissions || {}
  loggedIn.value = true
}

async function doLogout() {
  try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }) } catch {}
  // Alte localStorage-Reste aufräumen (einmalige Migration)
  localStorage.removeItem('fw_jwt')
  localStorage.removeItem('fw_user')
  currentUser.value = null
  appPermissions.value = {}
  loggedIn.value = false
}

// ── Sichtbare Apps (nach Berechtigung) ──────────────────────────────────
const visibleApps = computed(() => {
  const perms = appPermissions.value
  // Wenn keine Berechtigungen konfiguriert → alle Apps anzeigen
  if (Object.keys(perms).length === 0) return config.APPS
  return config.APPS.filter((app: AppConfig) => !!perms[app.id])
})

// ── Dark Mode ───────────────────────────────────────────────────────────
const darkMode = ref(localStorage.getItem('darkMode') === 'true')
function toggleDark() {
  darkMode.value = !darkMode.value
  localStorage.setItem('darkMode', String(darkMode.value))
  document.documentElement.classList.toggle('dark', darkMode.value)
}

// ── Uhr ─────────────────────────────────────────────────────────────────
const time = ref('')
const date = ref('')
let clockInterval: ReturnType<typeof setInterval>

function updateClock() {
  const now = new Date()
  time.value = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  date.value = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Health Checks ───────────────────────────────────────────────────────
type HealthStatus = 'checking' | 'online' | 'offline'
const health = reactive<Record<string, HealthStatus>>({})

async function checkHealth(appId: string, url?: string) {
  if (!url) { health[appId] = 'offline'; return }
  health[appId] = 'checking'
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
    health[appId] = res.ok ? 'online' : 'offline'
  } catch {
    health[appId] = 'offline'
  }
}

function checkAllHealth() {
  for (const app of config.APPS) {
    checkHealth(app.id, app.healthUrl)
  }
}

let healthInterval: ReturnType<typeof setInterval>

onMounted(async () => {
  await tryRestoreSession()
  updateClock()
  clockInterval = setInterval(updateClock, 30_000)
  checkAllHealth()
  healthInterval = setInterval(checkAllHealth, 60_000)
})

onUnmounted(() => {
  clearInterval(clockInterval)
  clearInterval(healthInterval)
})

// ── Farb-Utilities ──────────────────────────────────────────────────────
const colorMap: Record<string, { header: string; iconBg: string; iconText: string; link: string }> = {
  red:   { header: 'bg-red-500',   iconBg: 'bg-red-50 dark:bg-red-900/20',     iconText: 'text-red-600 dark:text-red-400',     link: 'text-red-600 dark:text-red-400' },
  amber: { header: 'bg-amber-500', iconBg: 'bg-amber-50 dark:bg-amber-900/20', iconText: 'text-amber-600 dark:text-amber-400', link: 'text-amber-600 dark:text-amber-400' },
  blue:  { header: 'bg-blue-500',  iconBg: 'bg-blue-50 dark:bg-blue-900/20',   iconText: 'text-blue-600 dark:text-blue-400',   link: 'text-blue-600 dark:text-blue-400' },
  green: { header: 'bg-green-500', iconBg: 'bg-green-50 dark:bg-green-900/20', iconText: 'text-green-600 dark:text-green-400', link: 'text-green-600 dark:text-green-400' },
}
const fallback = colorMap.red

function headerClass(c: string) { return (colorMap[c] || fallback).header }
function iconBgClass(c: string) { return (colorMap[c] || fallback).iconBg }
function iconTextClass(c: string) { return (colorMap[c] || fallback).iconText }
function linkClass(c: string) { return (colorMap[c] || fallback).link }

// ── Status-Utilities ────────────────────────────────────────────────────
function statusLabel(id: string): string {
  const s = health[id]
  if (s === 'online') return 'Online'
  if (s === 'offline') return 'Offline'
  return 'Prüfe…'
}
function statusTitle(id: string): string {
  const s = health[id]
  if (s === 'online') return 'Service ist erreichbar'
  if (s === 'offline') return 'Service nicht erreichbar'
  return 'Status wird geprüft…'
}
function statusDotClass(id: string): string {
  const s = health[id]
  if (s === 'online') return 'bg-green-500 status-pulse'
  if (s === 'offline') return 'bg-gray-300 dark:bg-gray-600'
  return 'bg-amber-400 status-pulse'
}
function statusTextClass(id: string): string {
  const s = health[id]
  if (s === 'online') return 'text-green-600 dark:text-green-400'
  if (s === 'offline') return 'text-gray-400 dark:text-gray-500'
  return 'text-amber-500 dark:text-amber-400'
}
</script>
