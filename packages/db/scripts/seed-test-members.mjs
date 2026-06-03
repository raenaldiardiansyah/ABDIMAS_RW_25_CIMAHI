/* eslint-disable no-console */

const routePath = "/api/identity/strict-register";

function normalizeBaseUrl(value) {
  return value.replace(/\/$/, "");
}

async function routeExists(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}${routePath}`, {
      method: "GET",
    });

    return res.status !== 404;
  } catch {
    return false;
  }
}

async function resolveBaseUrl() {
  const candidates = [
    process.env.SEED_APP_URL,
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
    process.env.APP_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]
    .filter(Boolean)
    .map(normalizeBaseUrl);

  for (const baseUrl of [...new Set(candidates)]) {
    if (await routeExists(baseUrl)) {
      return baseUrl;
    }
  }

  throw new Error(
    `Seed route not found. Checked: ${[...new Set(candidates)].join(", ") || "no candidates"}`,
  );
}

const testMembers = [
  {
    username: "warga001",
    email: "warga001@rw25.test",
    password: "Test12345!",
    fullName: "Ahmad Fauzi",
    nik: "3273011501900001",
  },
  {
    username: "warga002",
    email: "warga002@rw25.test",
    password: "Test12345!",
    fullName: "Siti Aisyah",
    nik: "3273015502910002",
  },
  {
    username: "warga003",
    email: "warga003@rw25.test",
    password: "Test12345!",
    fullName: "Budi Santoso",
    nik: "3273011203850003",
  },
  {
    username: "warga004",
    email: "warga004@rw25.test",
    password: "Test12345!",
    fullName: "Dewi Lestari",
    nik: "3273014707880004",
  },
  {
    username: "warga005",
    email: "warga005@rw25.test",
    password: "Test12345!",
    fullName: "Rizky Pratama",
    nik: "3273010912950005",
  },
];

function printCredentialList(members) {
  console.log("");
  console.log("Test credentials:");

  for (const member of members) {
    console.log(
      `- ${member.fullName} | email: ${member.email} | username: ${member.username} | NIK: ${member.nik} | password: ${member.password}`,
    );
  }
}

async function seedMember(baseUrl, member) {
  const res = await fetch(`${baseUrl}${routePath}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(member),
  });

  const json = await res.json().catch(() => ({}));

  if (res.ok) {
    return {
      status: "created",
      member,
      response: json,
    };
  }

  if (res.status === 409) {
    return {
      status: "exists",
      member,
      response: json,
    };
  }

  return {
    status: "failed",
    member,
    response: json,
    httpStatus: res.status,
  };
}

async function main() {
  const baseUrl = await resolveBaseUrl();
  console.log(`Seeding test members via ${baseUrl}/api/identity/strict-register`);

  const results = [];
  for (const member of testMembers) {
    const result = await seedMember(baseUrl, member);
    results.push(result);

    if (result.status === "created") {
      console.log(`CREATED  ${member.username}  ${member.nik}`);
      continue;
    }

    if (result.status === "exists") {
      console.log(`EXISTS   ${member.username}  ${member.nik}`);
      continue;
    }

    console.log(`FAILED   ${member.username}  ${member.nik}  HTTP ${result.httpStatus}`);
    console.log(result.response);
  }

  const summary = results.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    { created: 0, exists: 0, failed: 0 },
  );

  console.log("");
  console.log("Seed summary:");
  console.log(summary);
  printCredentialList(testMembers);

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Seed failed");
  console.error(error);
  process.exit(1);
});
