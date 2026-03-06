// Portal Runtime-Konfiguration
// Wird per Volume in den Container gemountet
window.PORTAL_CONFIG = {
  FEUERWEHR_NAME: "FF Wietmarschen",
  APPS: [
    {
      id: "psa",
      name: "PSA-Verwaltung",
      description: "Persönliche Schutzausrüstung verwalten, prüfen und dokumentieren",
      path: "/psa/",
      icon: "ph-shield-checkered",
      color: "red",
      healthUrl: "/psa/api/"
    },
    {
      id: "food",
      name: "FoodBot",
      description: "Essensbestellungen per RFID-Karte erfassen und verwalten",
      path: "/food/",
      icon: "ph-hamburger",
      color: "amber",
      healthUrl: "/food/health"
    },
    {
      id: "fk",
      name: "Führerscheinkontrolle",
      description: "Führerscheine der Maschinisten prüfen und dokumentieren",
      path: "/fk/",
      icon: "ph-identification-card",
      color: "blue",
      healthUrl: "/fk/api/health"
    }
  ]
};
