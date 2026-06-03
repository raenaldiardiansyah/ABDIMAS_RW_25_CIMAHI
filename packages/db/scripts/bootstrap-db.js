/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");
const { neon, neonConfig } = require("@neondatabase/serverless");

function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function splitSqlStatements(sqlText) {
  // Minimal SQL splitter that respects:
  // - single quotes: '...'
  // - dollar-quoted blocks: $$...$$
  // This is enough for `drizzle/0000_init.sql`.
  const statements = [];
  let current = "";
  let inSingleQuote = false;
  let inDollarQuote = false;

  for (let i = 0; i < sqlText.length; i++) {
    const ch = sqlText[i];
    const next = sqlText[i + 1];

    if (!inDollarQuote) {
      if (ch === "'" && !inSingleQuote) {
        inSingleQuote = true;
        current += ch;
        continue;
      }
      if (ch === "'" && inSingleQuote) {
        // Handle escaped '' inside strings
        if (next === "'") {
          current += "''";
          i++;
          continue;
        }
        inSingleQuote = false;
        current += ch;
        continue;
      }
    }

    if (!inSingleQuote) {
      if (!inDollarQuote && ch === "$" && next === "$") {
        inDollarQuote = true;
        current += "$$";
        i++;
        continue;
      }
      if (inDollarQuote && ch === "$" && next === "$") {
        inDollarQuote = false;
        current += "$$";
        i++;
        continue;
      }
    }

    if (!inSingleQuote && !inDollarQuote && ch === ";") {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = "";
      continue;
    }

    current += ch;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);

  return statements;
}

async function main() {
  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envText = fs.readFileSync(envPath, "utf8");
      const m = envText.match(/(?:^|\r?\n)DATABASE_URL=([^\r\n]+)/);
      if (m) {
        databaseUrl = m[1].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  }
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL env var");
    process.exit(1);
  }

  const sqlFile = path.join(process.cwd(), "drizzle", "0000_init.sql");
  const raw = stripBom(fs.readFileSync(sqlFile, "utf8"));

  // Remove "-- ..." single-line comments (safe for our migration file)
  const withoutComments = raw.replace(/^\s*--.*$/gm, "");
  const statements = splitSqlStatements(withoutComments);

  // Some Neon connection strings include `:5432` (pooler). Force fetch over 443.
  neonConfig.fetchEndpoint = (host) => `https://${host}/sql`;

  const sql = neon(databaseUrl);
  console.log(`Applying ${statements.length} SQL statements from drizzle/0000_init.sql...`);

  for (let idx = 0; idx < statements.length; idx++) {
    const statement = statements[idx];
    try {
      await sql.query(statement);
    } catch (e) {
      console.error(`Failed at statement #${idx + 1}:\n${statement}\n`);
      throw e;
    }
  }

  console.log("DB bootstrap done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
