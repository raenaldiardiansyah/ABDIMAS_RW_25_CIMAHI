function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} env var`);
  return value;
}

export const env = {
  DATABASE_URL: () => required("DATABASE_URL"),
  BETTER_AUTH_SECRET: () => required("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: () => process.env.BETTER_AUTH_URL,
  ADMIN_EMAILS: () => (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean),
  NIK_ENCRYPTION_KEY_BASE64: () => required("NIK_ENCRYPTION_KEY_BASE64"),
  NIK_HASH_PEPPER: () => required("NIK_HASH_PEPPER"),
};

