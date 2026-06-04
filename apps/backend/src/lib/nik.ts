import { createDecipheriv } from "crypto";

function decodeBase64Key32(keyBase64: string) {
  const trimmed = keyBase64.trim();
  if (!trimmed) {
    throw new Error("NIK_ENCRYPTION_KEY_BASE64 not set");
  }

  const normalized = trimmed.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const key = Buffer.from(padded, "base64");
  if (key.length !== 32) {
    throw new Error("NIK_ENCRYPTION_KEY_BASE64 must be 32 bytes (base64-encoded)");
  }
  return key;
}

export function decryptNik(payloadBase64: string, keyBase64: string) {
  const key = decodeBase64Key32(keyBase64);
  const json = Buffer.from(payloadBase64, "base64").toString("utf8");
  const payload = JSON.parse(json) as { v: 1; iv: string; tag: string; ct: string };

  if (payload.v !== 1) {
    throw new Error("Unsupported NIK payload version");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(payload.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ct, "base64")),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}
