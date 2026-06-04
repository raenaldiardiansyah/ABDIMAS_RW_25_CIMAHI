export const backendConfig = {
  port: Number(process.env.PORT || 4000),
  appUrl: process.env.BACKEND_URL || "http://localhost:4000",
  r2AccountId: process.env.R2_ACCOUNT_ID || "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  r2BucketName: process.env.R2_BUCKET_NAME || "",
  r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL || "",
};
