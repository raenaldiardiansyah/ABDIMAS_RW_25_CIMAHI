/* eslint-disable no-console */

const { randomBytes } = require("crypto");

function base64(bytes) {
  return randomBytes(bytes).toString("base64");
}

function main() {
  console.log("Copy into .env (do not commit):");
  console.log("");
  console.log(`BETTER_AUTH_SECRET="${base64(48)}"`);
  console.log('BETTER_AUTH_URL="http://localhost:3000"');
  console.log(`NIK_ENCRYPTION_KEY_BASE64="${base64(32)}"`);
  console.log(`NIK_HASH_PEPPER="${base64(48)}"`);
}

main();

