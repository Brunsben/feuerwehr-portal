import * as crypto from "crypto";

export function generateSecurePassword(length = 12): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const special = "!@#$%";
  let password = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length - 1; i++) {
    password += chars[bytes[i] % chars.length];
  }
  password += special[bytes[length - 1] % special.length];
  return password;
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^\w.\-]/g, "_").slice(0, 200);
}
