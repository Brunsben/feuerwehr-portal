# Feuerwehr-Portal

Zentrales Dashboard-Portal für Feuerwehren. Vereint alle digitalen Anwendungen unter einer Oberfläche mit einheitlicher Authentifizierung.

## Funktionen

- **Zentrales Dashboard** mit App-Kacheln und Status-Anzeige (online/offline)
- **Einheitlicher Login** über PostgREST JWT-Authentifizierung
- **Rollenbasierte Sichtbarkeit** — Apps werden je nach Berechtigung angezeigt
- **Health-Monitoring** — Live-Status aller Sub-Apps
- **Dark Mode** — Umschaltbar über Header-Toggle
- **PWA-ready** — Optimiert für mobile Nutzung

## Integrierte Apps

| App | Pfad | Beschreibung |
|-----|------|-------------|
| PSA-Verwaltung | `/psa/` | Persönliche Schutzausrüstung, Prüfungen, Wäschen |
| Essensbestellung | `/food/` | Menüpläne und Bestellungen (FoodBot) |
| Führerscheinkontrolle | `/fk/` | Führerscheinprüfungen der Maschinisten |

## Tech-Stack

- **Frontend:** Vue 3, TypeScript, Tailwind CSS 4
- **Build:** Vite 6
- **Server:** nginx 1.28 (Alpine)
- **Container:** Docker + Docker Compose
- **Auth:** JWT über PostgREST (PSA-Backend)

## Entwicklung

```bash
npm install
npm run dev
```

## Deployment

```bash
docker compose up -d --build
```

Das Portal orchestriert alle Services über `docker-compose.yml`. Die Sub-Apps (PSA, FoodBot, FK-App) werden als eigene Container gebaut und über nginx als Reverse-Proxy unter ihren Pfaden bereitgestellt.

## Konfiguration

Kopiere `.env.example` nach `.env` und passe die Werte an. Die Portal-Konfiguration (App-Liste, Feuerwehr-Name) erfolgt in `config.js`.
