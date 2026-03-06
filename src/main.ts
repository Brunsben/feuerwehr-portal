import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

if (!window.PORTAL_CONFIG) {
  document.body.innerHTML = '<div style="padding:2rem;font-family:sans-serif;color:#dc2626">' +
    '<h1>Konfiguration fehlt</h1>' +
    '<p>config.js nicht geladen.</p>' +
    '</div>'
  throw new Error('config.js nicht geladen.')
}

createApp(App).mount('#app')
