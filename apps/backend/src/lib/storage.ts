import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

import { backendConfig } from "../config.js";
import { AppError } from "./errors.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const SAFE_EXTENSIONS_BY_CONTENT_TYPE: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

let client: S3Client | null = null;

export function ensureStorageConfigured() {
  if (
    !backendConfig.r2AccountId ||
    !backendConfig.r2AccessKeyId ||
    !backendConfig.r2SecretAccessKey ||
    !backendConfig.r2BucketName
  ) {
    throw new AppError(
      500,
      "INTERNAL_ERROR",
      "Cloudflare R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.",
    );
  }
}

function getClient() {
  if (client) return client;

  ensureStorageConfigured();

  client = new S3Client({
    region: "auto",
    endpoint: `https://${backendConfig.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: backendConfig.r2AccessKeyId,
      secretAccessKey: backendConfig.r2SecretAccessKey,
    },
  });

  return client;
}

export function validateUpload(file: File) {
  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    throw new AppError(400, "VALIDATION_ERROR", `Unsupported file type for ${file.name}`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new AppError(400, "VALIDATION_ERROR", `${file.name} exceeds the 5MB limit`);
  }
}

export function buildObjectKeyForEntity(input: { entityType: string; entityId: string; kind: string; file: File }) {
  const safeExt = SAFE_EXTENSIONS_BY_CONTENT_TYPE[input.file.type] ?? "";
  const randomSuffix = randomUUID();
  return `${input.entityType.toLowerCase()}/${input.entityId}/${input.kind.toLowerCase()}-${Date.now()}-${randomSuffix}${safeExt}`;
}

export function buildObjectKeyForFile(input: { mutationId: string; kind: string; file: File }) {
  return buildObjectKeyForEntity({
    entityType: "mutations",
    entityId: input.mutationId,
    kind: input.kind,
    file: input.file,
  });
}

export async function uploadObject(input: {
  key: string;
  file: File;
}) {
  try {
    const fileBuffer = Buffer.from(await input.file.arrayBuffer());
    await getClient().send(
      new PutObjectCommand({
        Bucket: backendConfig.r2BucketName,
        Key: input.key,
        Body: fileBuffer,
        ContentType: input.file.type,
      }),
    );
  } catch (error) {
    throw new AppError(
      500,
      "INTERNAL_ERROR",
      `Failed to upload ${input.file.name} to Cloudflare R2.`,
      error instanceof Error ? { cause: error.message } : undefined,
    );
  }
}

export async function deleteObject(key: string) {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: backendConfig.r2BucketName,
      Key: key,
    }),
  );
}

export async function buildObjectUrl(key: string, options?: { signedOnly?: boolean }) {
  if (backendConfig.r2PublicBaseUrl && !options?.signedOnly) {
    return `${backendConfig.r2PublicBaseUrl.replace(/\/$/, "")}/${key}`;
  }

  return getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: backendConfig.r2BucketName,
      Key: key,
    }),
    { expiresIn: 3600 },
  );
}
