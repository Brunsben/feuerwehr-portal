<template>
  <div class="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-gray-100 dark:border-gray-700">
      <div class="text-center mb-6">
        <span class="text-4xl">🔥</span>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white mt-2">{{ config.FEUERWEHR_NAME }}</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Digitales Portal</p>
      </div>

      <!-- Ersteinrichtung -->
      <div v-if="isSetup">
        <p class="text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 mb-4">
          Noch kein Account vorhanden.<br>Lege jetzt den ersten Admin-Account an.
        </p>
        <div class="grid gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Benutzername</label>
            <input v-model="form.username" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" @keyup.enter="doSetup" autocomplete="username" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passwort</label>
            <input v-model="form.pin" type="password" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" @keyup.enter="doSetup" autocomplete="new-password" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passwort bestätigen</label>
            <input v-model="form.pinConfirm" type="password" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" @keyup.enter="doSetup" autocomplete="new-password" />
          </div>
          <div v-if="error" class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{{ error }}</div>
          <button @click="doSetup" :disabled="loading"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors mt-2">
            <i class="ph ph-user-plus"></i>
            Admin anlegen
          </button>
        </div>
      </div>

      <!-- Login -->
      <div v-else>
        <div class="grid gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Benutzername</label>
            <input v-model="form.username" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Benutzername" @keyup.enter="doLogin" autocomplete="username" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passwort</label>
            <input v-model="form.pin" type="password" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="••••" @keyup.enter="doLogin" autocomplete="current-password" />
          </div>
          <div v-if="error" class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{{ error }}</div>
          <button @click="doLogin" :disabled="loading"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors mt-2">
            <i class="ph ph-sign-in"></i>
            Anmelden
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits<{
  (e: 'loggedIn', payload: { token: string; user: { Benutzername: string; Rolle: string; app_permissions?: Record<string, string> } }): void
}>()

const config = window.PORTAL_CONFIG
const form = ref({ username: '', pin: '', pinConfirm: '' })
const error = ref('')
const loading = ref(false)
const isSetup = ref(false)

onMounted(async () => {
  try {
    const r = await fetch('/psa/api/rpc/is_initialized', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    if (r.ok) {
      const data = await r.json()
      isSetup.value = !data
    }
  } catch { /* kein Setup-Screen bei Netzwerkfehler */ }
})

async function doLogin() {
  error.value = ''
  if (!form.value.username || !form.value.pin) {
    error.value = 'Bitte Benutzername und Passwort eingeben.'
    return
  }
  loading.value = true
  try {
    const r = await fetch('/psa/api/rpc/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ benutzername: form.value.username, pin: form.value.pin }),
    })
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { message?: string }
      throw new Error(err.message || 'Benutzername oder Passwort falsch')
    }
    const data = await r.json()
    emit('loggedIn', { token: data.token, user: data.user })
  } catch (e: any) {
    error.value = e.message || 'Anmeldung fehlgeschlagen'
  } finally {
    loading.value = false
  }
}

async function doSetup() {
  error.value = ''
  if (!form.value.username || !form.value.pin) { error.value = 'Bitte alle Felder ausfüllen.'; return }
  if (form.value.pin.length < 6) { error.value = 'Passwort muss mindestens 6 Zeichen haben.'; return }
  if (form.value.pin !== form.value.pinConfirm) { error.value = 'Passwörter stimmen nicht überein.'; return }
  loading.value = true
  try {
    const r = await fetch('/psa/api/rpc/create_admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ benutzername: form.value.username, pin: form.value.pin }),
    })
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { message?: string }
      throw new Error(err.message || 'Einrichtung fehlgeschlagen')
    }
    const data = await r.json()
    emit('loggedIn', { token: data.token, user: data.user })
  } catch (e: any) {
    error.value = e.message || 'Einrichtung fehlgeschlagen'
  } finally {
    loading.value = false
  }
}
</script>
