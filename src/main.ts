import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

if (!window.PORTAL_CONFIG) {
  const errDiv = document.createElement('div')
  errDiv.style.cssText = 'padding:2rem;font-family:sans-serif;color:#dc2626'
  const h1 = document.createElement('h1')
  h1.textContent = 'Konfiguration fehlt'
  const p = document.createElement('p')
  p.textContent = 'config.js nicht geladen.'
  errDiv.append(h1, p)
  document.body.replaceChildren(errDiv)
  throw new Error('config.js nicht geladen.')
}

createApp(App).mount('#app')
