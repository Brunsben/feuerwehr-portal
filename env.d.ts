/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface PortalConfig {
  FEUERWEHR_NAME: string
  APPS: AppConfig[]
}

interface AppConfig {
  id: string
  name: string
  description: string
  path: string
  icon: string
  color: string
  healthUrl?: string
}

interface Window {
  PORTAL_CONFIG: PortalConfig
}
