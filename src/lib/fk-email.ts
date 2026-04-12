import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || "noreply@feuerwehr.local",
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

export function checkReminderEmail(
  name: string,
  weeksUntilDue: number,
  dueDate: string,
) {
  return {
    subject: `🚒 Führerscheinkontrolle in ${weeksUntilDue} Woche${weeksUntilDue > 1 ? "n" : ""} fällig`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🚒 Führerscheinkontrolle</h2>
        <p>Hallo ${name},</p>
        <p>Deine Führerscheinkontrolle ist in <strong>${weeksUntilDue} Woche${weeksUntilDue > 1 ? "n" : ""}</strong> fällig (${dueDate}).</p>
        <p>Bitte bringe deinen Führerschein zum nächsten Dienst mit oder lade ein Foto über das Portal hoch.</p>
      </div>
    `,
  };
}

export function licenseExpiryEmail(
  name: string,
  licenseClass: string,
  expiryDate: string,
) {
  return {
    subject: `⚠️ Führerschein ${licenseClass} läuft bald ab`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">⚠️ Führerschein-Ablauf</h2>
        <p>Hallo ${name},</p>
        <p>Dein Führerschein der Klasse <strong>${licenseClass}</strong> läuft am <strong>${expiryDate}</strong> ab.</p>
        <p>Bitte kümmere dich rechtzeitig um eine Verlängerung.</p>
      </div>
    `,
  };
}

export function adminSummaryEmail(
  adminName: string,
  overdueChecks: { name: string; dueDate: string }[],
  upcomingChecks: { name: string; dueDate: string }[],
  expiringLicenses: {
    name: string;
    licenseClass: string;
    expiryDate: string;
  }[],
) {
  return {
    subject: "🚒 Wöchentliche Zusammenfassung – Führerscheinkontrolle",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🚒 Wöchentliche Zusammenfassung</h2>
        <p>Hallo ${adminName},</p>

        ${
          overdueChecks.length > 0
            ? `
          <h3 style="color: #dc2626;">🔴 Überfällige Kontrollen (${overdueChecks.length})</h3>
          <ul>${overdueChecks.map((c) => `<li>${c.name} – fällig seit ${c.dueDate}</li>`).join("")}</ul>
        `
            : ""
        }

        ${
          upcomingChecks.length > 0
            ? `
          <h3 style="color: #f59e0b;">🟡 Bald fällige Kontrollen (${upcomingChecks.length})</h3>
          <ul>${upcomingChecks.map((c) => `<li>${c.name} – fällig am ${c.dueDate}</li>`).join("")}</ul>
        `
            : ""
        }

        ${
          expiringLicenses.length > 0
            ? `
          <h3 style="color: #f59e0b;">⚠️ Ablaufende Führerscheine (${expiringLicenses.length})</h3>
          <ul>${expiringLicenses.map((l) => `<li>${l.name} – ${l.licenseClass} läuft ab am ${l.expiryDate}</li>`).join("")}</ul>
        `
            : ""
        }

        ${
          overdueChecks.length === 0 &&
          upcomingChecks.length === 0 &&
          expiringLicenses.length === 0
            ? `
          <p style="color: #16a34a;">✅ Alles in Ordnung – keine offenen Kontrollen oder ablaufenden Führerscheine.</p>
        `
            : ""
        }
      </div>
    `,
  };
}
