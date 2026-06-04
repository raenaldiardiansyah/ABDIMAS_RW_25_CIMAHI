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
    name: "Ahmad Fauzi",
    nik: "3273011501900001",
    gender: "L",
    birthPlace: "Cimahi",
    birthDate: "1990-01-15",
    religion: "Islam",
    maritalStatus: "KAWIN",
    occupation: "Wiraswasta",
    education: "SMA/Sederajat",
    bloodType: "O",
    address: "Jl. Melati No. 1",
    rt: "001",
    rw: "025",
    status: "PENDUDUK_TETAP",
    kkNumber: "3273010101010001",
    familyRelationship: "Kepala Keluarga",
  },
  {
    username: "warga002",
    email: "warga002@rw25.test",
    password: "Test12345!",
    name: "Siti Aisyah",
    nik: "3273015502910002",
    gender: "P",
    birthPlace: "Cimahi",
    birthDate: "1991-02-15",
    religion: "Islam",
    maritalStatus: "KAWIN",
    occupation: "Ibu Rumah Tangga",
    education: "SMA/Sederajat",
    bloodType: "A",
    address: "Jl. Melati No. 1",
    rt: "001",
    rw: "025",
    status: "PENDUDUK_TETAP",
    kkNumber: "3273010101010001",
    familyRelationship: "Istri",
  },
  {
    username: "warga003",
    email: "warga003@rw25.test",
    password: "Test12345!",
    name: "Budi Santoso",
    nik: "3273011203850003",
    gender: "L",
    birthPlace: "Cimahi",
    birthDate: "1985-03-12",
    religion: "Islam",
    maritalStatus: "KAWIN",
    occupation: "Karyawan Swasta",
    education: "SMA/Sederajat",
    bloodType: "B",
    address: "Jl. Anggrek No. 8",
    rt: "002",
    rw: "025",
    status: "PENDUDUK_TETAP",
    kkNumber: "3273010202020002",
    familyRelationship: "Kepala Keluarga",
  },
  {
    username: "warga004",
    email: "warga004@rw25.test",
    password: "Test12345!",
    name: "Dewi Lestari",
    nik: "3273014707880004",
    gender: "P",
    birthPlace: "Bandung",
    birthDate: "1988-08-07",
    religion: "Islam",
    maritalStatus: "KAWIN",
    occupation: "Guru",
    education: "D4/S1",
    bloodType: "AB",
    address: "Jl. Anggrek No. 8",
    rt: "002",
    rw: "025",
    status: "PENDUDUK_TETAP",
    kkNumber: "3273010202020002",
    familyRelationship: "Istri",
  },
  {
    username: "warga005",
    email: "warga005@rw25.test",
    password: "Test12345!",
    name: "Rizky Pratama",
    nik: "3273010912950005",
    gender: "L",
    birthPlace: "Cimahi",
    birthDate: "1995-12-09",
    religion: "Islam",
    maritalStatus: "BELUM_KAWIN",
    occupation: "Pelajar/Mahasiswa",
    education: "D4/S1",
    bloodType: "Tidak Tahu",
    address: "Jl. Kenanga No. 4",
    rt: "003",
    rw: "025",
    status: "NGEKOST",
  },
];

function printCredentialList(members) {
  console.log("");
  console.log("Test credentials:");

  for (const member of members) {
    console.log(
      `- ${member.name} | email: ${member.email} | username: ${member.username} | NIK: ${member.nik} | password: ${member.password}`,
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
