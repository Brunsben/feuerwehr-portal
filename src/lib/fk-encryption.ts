import * as crypto from "crypto";
import * as fs from "fs/promises";
import * as path from "path";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("ENCRYPTION_KEY muss 64 Hex-Zeichen (32 Bytes) lang sein");
  }
  return Buffer.from(hex, "hex");
}

export async function encryptAndSave(
  data: Buffer,
  filePath: string,
): Promise<void> {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const output = Buffer.concat([iv, authTag, encrypted]);

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, output);
}

export async function readAndDecrypt(filePath: string): Promise<Buffer> {
  const key = getKey();
  const raw = await fs.readFile(filePath);

  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export async function deleteEncryptedFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // Datei existiert evtl. nicht mehr
  }
}

export function generateUploadPath(userId: string, side: string): string {
  const ts = Date.now();
  const rand = crypto.randomBytes(8).toString("hex");
  return path.join(
    process.cwd(),
    "data",
    "uploads",
    userId,
    `${ts}-${side}-${rand}.enc`,
  );
}
