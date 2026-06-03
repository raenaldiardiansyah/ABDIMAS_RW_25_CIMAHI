/* eslint-disable no-console */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

import { hashPassword } from "@better-auth/utils/password";
import pg from "pg";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../../..");

const adminUsers = [
  {
    name: "Admin RW 25",
    email: "admin@rw25.test",
    username: "adminrw25",
    displayUsername: "adminrw25",
    password: "Admin12345!",
    role: "ADMIN",
    status: "ACTIVE",
  },
  {
    name: "Admin RT 01",
    email: "rt01@rw25.test",
    username: "adminrt01",
    displayUsername: "adminrt01",
    password: "Admin12345!",
    role: "ADMIN",
    status: "ACTIVE",
  },
];

function readEnvValue(name) {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(workspaceRoot, ".env"),
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const text = fs.readFileSync(envPath, "utf8");
    const match = text.match(new RegExp(`(?:^|\\r?\\n)${name}=([^\\r\\n]+)`));
    if (match?.[1]) {
      return match[1].trim().replace(/^['"]|['"]$/g, "");
    }
  }

  return undefined;
}

function printCredentialList(items) {
  console.log("");
  console.log("Admin credentials:");
  for (const item of items) {
    console.log(
      `- ${item.name} | email: ${item.email} | username: ${item.username} | password: ${item.password}`,
    );
  }
}

async function upsertAdmin(client, admin) {
  const hashedPassword = await hashPassword(admin.password);
  const statusColumnResult = await client.query(
    `
      select 1
      from information_schema.columns
      where table_name = 'user' and column_name = 'status'
      limit 1
    `,
  );
  const hasStatusColumn = statusColumnResult.rowCount > 0;

  const existingUserResult = await client.query(
    `
      select id
      from "user"
      where lower(email) = lower($1) or lower(username) = lower($2)
      limit 1
    `,
    [admin.email, admin.username],
  );

  let userId;
  let status;

  if (existingUserResult.rows[0]?.id) {
    userId = existingUserResult.rows[0].id;

    await client.query(
      `
        update "user"
        set
          name = $2,
          email = lower($3),
          username = lower($4),
          display_username = $5,
          role = $6,
          ${hasStatusColumn ? "status = $7," : ""}
          updated_at = now()
        where id = $1
      `,
      hasStatusColumn
        ? [
            userId,
            admin.name,
            admin.email,
            admin.username,
            admin.displayUsername,
            admin.role,
            admin.status,
          ]
        : [
            userId,
            admin.name,
            admin.email,
            admin.username,
            admin.displayUsername,
            admin.role,
          ],
    );

    status = "updated";
  } else {
    userId = randomUUID();
    const insertedUserResult = await client.query(
      `
        insert into "user" (
          id,
          name,
          email,
          email_verified,
          username,
          display_username,
          role
          ${hasStatusColumn ? ", status" : ""}
        )
        values ($1, $2, lower($3), false, lower($4), $5, $6${hasStatusColumn ? ", $7" : ""})
        returning id
      `,
      hasStatusColumn
        ? [
            userId,
            admin.name,
            admin.email,
            admin.username,
            admin.displayUsername,
            admin.role,
            admin.status,
          ]
        : [
            userId,
            admin.name,
            admin.email,
            admin.username,
            admin.displayUsername,
            admin.role,
          ],
    );

    userId = insertedUserResult.rows[0]?.id ?? userId;
    status = "created";
  }

  const existingAccountResult = await client.query(
    `
      select id
      from account
      where user_id = $1 and provider_id = 'credential'
      limit 1
    `,
    [userId],
  );

  if (existingAccountResult.rows[0]?.id) {
    await client.query(
      `
        update account
        set
          password = $2,
          account_id = $3,
          updated_at = now()
        where id = $1
      `,
      [existingAccountResult.rows[0].id, hashedPassword, userId],
    );
  } else {
    await client.query(
      `
        insert into account (
          id,
          user_id,
          account_id,
          provider_id,
          password
        )
        values ($1, $2, $3, 'credential', $4)
      `,
      [randomUUID(), userId, userId, hashedPassword],
    );
  }

  return { status, userId };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL || readEnvValue("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL env var");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    const results = [];

    for (const admin of adminUsers) {
      const result = await upsertAdmin(client, admin);
      results.push(result);
      console.log(`${result.status.toUpperCase()}  ${admin.username}  ${admin.email}`);
    }

    const summary = results.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      { created: 0, updated: 0 },
    );

    console.log("");
    console.log("Seed summary:");
    console.log(summary);
    printCredentialList(adminUsers);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Admin seed failed");
  console.error(error);
  process.exit(1);
});
