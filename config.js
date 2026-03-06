window.PORTAL_CONFIG = {
  FEUERWEHR_NAME: "OF Wietmarschen",
  APPS: [
    {
      id: "psa",
      name: "PSA-Verwaltung",
      description: "Persönliche Schutzausrüstung verwalten, Prüfungen und Wäschen dokumentieren.",
      path: "/psa/",
      icon: "ph-shield-check",
      color: "red",
      healthUrl: "/psa/api/"
    },
    {
      id: "food",
      name: "Essensbestellung",
      description: "Menüpläne erstellen und Bestellungen für Veranstaltungen verwalten.",
      path: "/food/",
      icon: "ph-fork-knife",
      color: "amber",
      healthUrl: "/food/api/status"
    },
    {
      id: "fk",
      name: "Führerscheinkontrolle",
      description: "Führerscheine der Maschinisten prüfen und Kontrollen dokumentieren.",
      path: "/fk/",
      icon: "ph-car",
      color: "blue",
      healthUrl: "/fk/"
    }
  ]
};
