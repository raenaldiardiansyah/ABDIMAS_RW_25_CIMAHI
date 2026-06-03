import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function decodeBase64Key32(keyBase64: string) {
  const trimmed = keyBase64.trim();
  if (!trimmed || trimmed.startsWith("CHANGE_ME")) {
    throw new Error("NIK_ENCRYPTION_KEY_BASE64 not set");
  }

  // Support base64url strings too
  const normalized = trimmed.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const key = Buffer.from(padded, "base64");
  if (key.length !== 32) {
    throw new Error("NIK_ENCRYPTION_KEY_BASE64 must be 32 bytes (base64-encoded)");
  }
  return key;
}

export function normalizeNik(input: string) {
  const nik = input.trim().replace(/\D/g, "");
  if (!/^\d{16}$/.test(nik)) {
    throw new Error("NIK harus 16 digit");
  }
  return nik;
}

export function maskNikFromParts(first4?: string | null, last4?: string | null) {
  if (!first4 || !last4) return "****";
  return `${first4}********${last4}`;
}

export function nikParts(nik: string) {
  return { first4: nik.slice(0, 4), last4: nik.slice(-4) };
}

export function hashNik(nik: string, pepper: string) {
  return createHash("sha256").update(`${pepper}:${nik}`).digest("hex");
}

type EncryptedNikPayloadV1 = {
  v: 1;
  iv: string; // base64
  tag: string; // base64
  ct: string; // base64
};

export function encryptNik(nik: string, keyBase64: string) {
  const key = decodeBase64Key32(keyBase64);

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(nik, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload: EncryptedNikPayloadV1 = {
    v: 1,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ct: ct.toString("base64"),
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

export function decryptNik(payloadBase64: string, keyBase64: string) {
  const key = decodeBase64Key32(keyBase64);

  const json = Buffer.from(payloadBase64, "base64").toString("utf8");
  const payload = JSON.parse(json) as EncryptedNikPayloadV1;
  if (!payload || payload.v !== 1) throw new Error("Unsupported NIK payload version");

  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const ct = Buffer.from(payload.ct, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}
