// typescript-eslint unterstützt TypeScript 7 noch nicht.
// Daher nur Basis-Regeln ohne TS-spezifische Checks.
// Reaktivieren sobald https://github.com/typescript-eslint/typescript-eslint/issues/10940 gefixt ist.

export default [
  {
    ignores: ["node_modules/", ".next/", "drizzle/"],
  },
];
