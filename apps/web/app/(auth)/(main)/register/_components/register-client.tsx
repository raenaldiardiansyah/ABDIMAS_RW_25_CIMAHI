"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { createCitizenSchema } from "@abdimas/contracts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/ui/page-header";
import { RT_OPTIONS } from "@/lib/rt-options";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username minimal 3 karakter")
  .max(30, "Username maksimal 30 karakter")
  .regex(/^[a-zA-Z0-9]+$/, "Username hanya boleh huruf dan angka")
  .transform((value) => value.toLowerCase());

const emailSchema = z
  .string()
  .trim()
  .email("Email tidak valid")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(200, "Password terlalu panjang")
  .refine((value) => /[A-Za-z]/.test(value), {
    message: "Password harus mengandung huruf",
  })
  .refine((value) => /\d/.test(value), {
    message: "Password harus mengandung angka",
  });

const onboardingSchema = createCitizenSchema.pick({
  nik: true,
  name: true,
  gender: true,
  birthPlace: true,
  birthDate: true,
  religion: true,
  maritalStatus: true,
  occupation: true,
  education: true,
  bloodType: true,
  address: true,
  rt: true,
  rw: true,
  status: true,
});

const schema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    kkNumber: z
      .string()
      .trim()
      .regex(/^\d{16}$/, "Nomor KK harus berisi 16 digit angka")
      .optional(),
    familyRelationship: z
      .string()
      .trim()
      .min(2, "Hubungan keluarga wajib diisi")
      .max(60)
      .optional(),
  })
  .and(onboardingSchema)
  .refine((data) => !isSuspiciousNikPattern(data.nik), {
    path: ["nik"],
    message: "Format NIK tidak valid",
  })
  .refine((data) => isValidNikDatePart(data.nik), {
    path: ["nik"],
    message: "Tanggal lahir pada NIK tidak valid",
  })
  .refine((data) => !passwordContainsUserData(data.password, data.email, data.username), {
    path: ["password"],
    message: "Password tidak boleh mengandung username atau email",
  })
  .refine((data) => !(data.kkNumber && !data.familyRelationship), {
    path: ["familyRelationship"],
    message: "Pilih hubungan keluarga jika nomor KK diisi",
  })
  .refine((data) => !(!data.kkNumber && data.familyRelationship), {
    path: ["kkNumber"],
    message: "Isi nomor KK jika hubungan keluarga dipilih",
  });

type FormField = keyof FormValues;
type StepId = 1 | 2 | 3 | 4;

type FormValues = {
  username: string;
  email: string;
  password: string;
  name: string;
  nik: string;
  gender: "" | "L" | "P";
  birthPlace: string;
  birthDate: string;
  religion: string;
  maritalStatus: string;
  occupation: string;
  education: string;
  bloodType?: string;
  address: string;
  rt: string;
  rw: string;
  status: "PENDUDUK_TETAP" | "NGEKOST";
  kkNumber?: string;
  familyRelationship?: string;
};

type StepConfig = {
  id: StepId;
  label: string;
  title: string;
  description: string;
  fields: FormField[];
};

const STEPS: StepConfig[] = [
  {
    id: 1,
    label: "Akun",
    title: "Buat akun warga",
    description: "Masukkan data login yang akan dipakai setelah akun diverifikasi.",
    fields: ["username", "email", "password"],
  },
  {
    id: 2,
    label: "Identitas",
    title: "Lengkapi data diri",
    description: "Data ini dipakai admin saat verifikasi dan promosi ke data penduduk.",
    fields: [
      "name",
      "nik",
      "gender",
      "birthPlace",
      "birthDate",
      "religion",
      "maritalStatus",
      "education",
      "occupation",
      "bloodType",
    ],
  },
  {
    id: 3,
    label: "Domisili",
    title: "Isi domisili warga",
    description: "Alamat domisili dipakai untuk RT/RW dan layanan warga setelah verified.",
    fields: ["address", "rt", "rw", "status"],
  },
  {
    id: 4,
    label: "Keluarga",
    title: "Keluarga dan konfirmasi",
    description: "Nomor KK opsional, lalu cek ulang seluruh data sebelum submit akhir.",
    fields: ["kkNumber", "familyRelationship"],
  },
];

const AGAMA_OPTIONS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"];
const PENDIDIKAN_OPTIONS = [
  "Tidak/Belum Sekolah",
  "SD/Sederajat",
  "SMP/Sederajat",
  "SMA/Sederajat",
  "D1",
  "D2",
  "D3",
  "D4/S1",
  "S2",
  "S3",
];
const PEKERJAAN_OPTIONS = [
  "Belum/Tidak Bekerja",
  "Pelajar/Mahasiswa",
  "PNS",
  "TNI",
  "Polri",
  "Karyawan Swasta",
  "Wiraswasta",
  "Pedagang",
  "Petani",
  "Nelayan",
  "Guru",
  "Dokter",
  "Buruh",
  "Ibu Rumah Tangga",
  "Pensiunan",
  "Lainnya",
];
const GOLONGAN_DARAH_OPTIONS = ["", "A", "B", "AB", "O", "Tidak Tahu"];
const FAMILY_RELATIONSHIP_OPTIONS = [
  "Kepala Keluarga",
  "Istri",
  "Anak",
  "Orang Tua",
  "Saudara",
  "Lainnya",
];

const INITIAL_VALUES: FormValues = {
  username: "",
  email: "",
  password: "",
  name: "",
  nik: "",
  gender: "",
  birthPlace: "",
  birthDate: "",
  religion: "",
  maritalStatus: "",
  occupation: "",
  education: "",
  bloodType: undefined,
  address: "",
  rt: "",
  rw: "025",
  status: "PENDUDUK_TETAP",
  kkNumber: undefined,
  familyRelationship: undefined,
};

function isSuspiciousNikPattern(nik: string) {
  const repeatedDigits = /^(\d)\1{15}$/.test(nik);
  const sequentialAscending = nik === "1234567890123456";
  const sequentialDescending = nik === "6543210987654321";
  return repeatedDigits || sequentialAscending || sequentialDescending;
}

function isValidNikDatePart(nik: string) {
  const dayRaw = Number(nik.slice(6, 8));
  const month = Number(nik.slice(8, 10));
  const day = dayRaw > 40 ? dayRaw - 40 : dayRaw;
  if (day < 1 || day > 31) return false;
  if (month < 1 || month > 12) return false;
  return true;
}

function passwordContainsUserData(password: string, email: string, username: string) {
  const lowerPassword = password.toLowerCase();
  const lowerUsername = username.toLowerCase();
  const emailPrefix = email.split("@")[0]?.toLowerCase();
  return (
    lowerPassword.includes(lowerUsername) ||
    (!!emailPrefix && emailPrefix.length >= 3 && lowerPassword.includes(emailPrefix))
  );
}

function getApiErrorMessage(data: unknown) {
  if (!data || typeof data !== "object") return null;
  const payload = data as {
    error?: string | { message?: string };
    message?: string;
  };
  if (typeof payload.error === "string") return payload.error;
  if (typeof payload.error?.message === "string") return payload.error.message;
  if (typeof payload.message === "string") return payload.message;
  return null;
}

function getErrorMessage(value: unknown) {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  return "Silakan coba lagi.";
}

function normalizeValues(values: FormValues) {
  return {
    username: values.username,
    email: values.email,
    password: values.password,
    name: values.name.trim(),
    nik: values.nik,
    gender: values.gender,
    birthPlace: values.birthPlace.trim(),
    birthDate: values.birthDate,
    religion: values.religion,
    maritalStatus: values.maritalStatus,
    occupation: values.occupation,
    education: values.education,
    bloodType: values.bloodType || undefined,
    address: values.address.trim(),
    rt: values.rt,
    rw: values.rw.replace(/\D/g, "").slice(0, 3),
    status: values.status,
    kkNumber: values.kkNumber?.trim() || undefined,
    familyRelationship: values.familyRelationship?.trim() || undefined,
  } satisfies FormValues;
}

function nextStep(step: StepId): StepId {
  if (step === 1) return 2;
  if (step === 2) return 3;
  if (step === 3) return 4;
  return 4;
}

function prevStep(step: StepId): StepId {
  if (step === 4) return 3;
  if (step === 3) return 2;
  if (step === 2) return 1;
  return 1;
}

function getStepErrors(issues: z.ZodIssue[], fields: FormField[]) {
  return issues
    .filter((issue) => {
      const field = issue.path[0];
      return typeof field === "string" && fields.includes(field as FormField);
    })
    .reduce<Partial<Record<FormField, string>>>((acc, issue) => {
      const field = issue.path[0];
      if (typeof field === "string" && !acc[field as FormField]) {
        acc[field as FormField] = issue.message;
      }
      return acc;
    }, {});
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] py-3 last:border-b-0">
      <span className="text-xs font-medium text-[color:var(--muted-foreground)]">{label}</span>
      <span className="max-w-[58%] text-right text-sm font-semibold text-[color:var(--panel-on-brand-foreground)]">
        {value || "-"}
      </span>
    </div>
  );
}

export default function RegisterClient() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<StepId>(1);
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [loading, setLoading] = useState(false);

  const currentStep = STEPS.find((item) => item.id === step) ?? STEPS[0];
  const progress = (step / STEPS.length) * 100;
  const normalizedValues = useMemo(() => normalizeValues(values), [values]);

  function setValue<K extends FormField>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validateStep(targetStep: StepConfig) {
    const parsed = schema.safeParse(normalizedValues);
    if (parsed.success) {
      setErrors({});
      return true;
    }

    const stepErrors = getStepErrors(parsed.error.issues, targetStep.fields);
    setErrors(stepErrors);

    const firstMessage = Object.values(stepErrors)[0];
    if (firstMessage) {
      toast({
        title: "Lengkapi data langkah ini",
        description: firstMessage,
        variant: "destructive",
      });
    }

    return Object.keys(stepErrors).length === 0;
  }

  function handleNext() {
    if (!validateStep(currentStep)) return;
    setStep((prev) => nextStep(prev));
  }

  function handleBack() {
    setStep((prev) => prevStep(prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = schema.safeParse(normalizedValues);
    if (!parsed.success) {
      const stepErrors = getStepErrors(parsed.error.issues, currentStep.fields);
      setErrors(stepErrors);
      const firstIssue = parsed.error.issues[0];
      toast({
        title: "Input tidak valid",
        description: firstIssue?.message || "Periksa kembali data yang kamu masukkan.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/identity/strict-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data) || "Gagal membuat akun");
      }

      toast({
        title: "Akun dibuat",
        description: "Pendaftaran berhasil. Lanjut ke portal warga.",
        variant: "success",
      });

      router.push("/warga");
    } catch (error: unknown) {
      toast({
        title: "Gagal daftar",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-[color:var(--primary)] text-[color:var(--primary-foreground)]">
      <div className="mx-auto flex h-screen w-full max-w-md flex-col overflow-hidden">
        <PageHeader
          title="Daftar Akun"
          variant="brand"
          className="border-b-0 px-6 pb-6"
          titleClassName="text-3xl font-extrabold leading-tight text-[color:var(--primary-foreground)]"
          descriptionClassName="text-sm text-[color:color-mix(in_srgb,var(--primary-foreground),transparent_18%)]"
          description="Langkah demi langkah, langsung siap untuk verifikasi warga."
          rightSlot={
            <Button
              type="button"
              onClick={() => (step === 1 ? router.back() : handleBack())}
              size="icon"
              variant="secondary"
              className="rounded-full border border-[color:color-mix(in_srgb,var(--primary-foreground),transparent_84%)] bg-[color:color-mix(in_srgb,var(--primary-foreground),transparent_88%)] text-[color:var(--primary-foreground)] hover:bg-[color:color-mix(in_srgb,var(--primary-foreground),transparent_80%)]"
              aria-label={step === 1 ? "Kembali" : "Kembali ke langkah sebelumnya"}
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
          }
          bottomSlot={
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                onClick={() => router.push("/sign-in")}
                variant="link"
                size="sm"
                className="h-auto px-0 py-0 text-sm font-semibold text-[color:var(--primary-foreground)] underline underline-offset-4 hover:text-[color:color-mix(in_srgb,var(--primary-foreground),transparent_14%)]"
              >
                Sudah punya akun? Masuk
              </Button>
              <span className="text-xs font-semibold text-[color:color-mix(in_srgb,var(--primary-foreground),transparent_18%)]">
                {step}/{STEPS.length}
              </span>
            </div>
          }
        />

        <section className="mt-4 h-fit max-h-full overflow-y-auto rounded-t-[30px] border border-[color:var(--border)] bg-[color:var(--panel-on-brand)] px-5 pb-8 pt-3 text-[color:var(--panel-on-brand-foreground)] shadow-2xl">
          <div className="space-y-3">
            <div className="overflow-hidden rounded-full bg-[color:color-mix(in_srgb,var(--primary),white_84%)]">
              <div
                className="h-2 rounded-full bg-[color:var(--primary)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="rounded-3xl border border-[color:var(--border)] bg-white/70 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--primary)]">
                Langkah {step}
              </p>
              <h2 className="mt-2 text-xl font-bold text-[color:var(--panel-on-brand-foreground)]">
                {currentStep.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[color:var(--muted-foreground)]">
                {currentStep.description}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {step === 1 ? (
              <>
                <Field
                  label="Username"
                  error={errors.username}
                  hint="Minimal 3 karakter. Hanya huruf dan angka."
                >
                  <Input
                    value={values.username}
                    onChange={(e) =>
                      setValue(
                        "username",
                        e.target.value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 30),
                      )
                    }
                    placeholder="contoh: warga025"
                    className={inputClassName}
                    autoComplete="username"
                    disabled={loading}
                  />
                </Field>

                <Field label="Email" error={errors.email}>
                  <Input
                    type="email"
                    value={values.email}
                    onChange={(e) => setValue("email", e.target.value.trim().toLowerCase())}
                    placeholder="warga@mail.com"
                    className={inputClassName}
                    autoComplete="email"
                    disabled={loading}
                  />
                </Field>

                <Field
                  label="Password"
                  error={errors.password}
                  hint="Minimal 8 karakter dengan kombinasi huruf dan angka."
                >
                  <Input
                    type="password"
                    value={values.password}
                    onChange={(e) => setValue("password", e.target.value)}
                    placeholder="Masukkan password"
                    className={inputClassName}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </Field>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Field label="Nama Lengkap" error={errors.name}>
                  <Input
                    value={values.name}
                    onChange={(e) => setValue("name", e.target.value.slice(0, 120))}
                    placeholder="Nama sesuai KTP"
                    className={inputClassName}
                    autoComplete="name"
                    disabled={loading}
                  />
                </Field>

                <Field label="NIK" error={errors.nik} hint={`${values.nik.length}/16 digit`}>
                  <Input
                    inputMode="numeric"
                    value={values.nik}
                    onChange={(e) => setValue("nik", e.target.value.replace(/\D/g, "").slice(0, 16))}
                    placeholder="16 digit NIK"
                    className={inputClassName}
                    autoComplete="off"
                    disabled={loading}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Jenis Kelamin" error={errors.gender}>
                    <select
                      value={values.gender}
                      onChange={(e) => setValue("gender", e.target.value as FormValues["gender"])}
                      disabled={loading}
                      className={selectClassName}
                    >
                      <option value="">Pilih</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </Field>

                  <Field label="Gol. Darah" error={errors.bloodType}>
                    <select
                      value={values.bloodType ?? ""}
                      onChange={(e) => setValue("bloodType", e.target.value || undefined)}
                      disabled={loading}
                      className={selectClassName}
                    >
                      {GOLONGAN_DARAH_OPTIONS.map((option) => (
                        <option key={option || "empty"} value={option}>
                          {option || "Pilih"}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tempat Lahir" error={errors.birthPlace}>
                    <Input
                      value={values.birthPlace}
                      onChange={(e) => setValue("birthPlace", e.target.value.slice(0, 120))}
                      placeholder="Contoh: Cimahi"
                      className={inputClassName}
                      disabled={loading}
                    />
                  </Field>

                  <Field label="Tanggal Lahir" error={errors.birthDate}>
                    <Input
                      type="date"
                      value={values.birthDate}
                      onChange={(e) => setValue("birthDate", e.target.value)}
                      className={inputClassName}
                      disabled={loading}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Agama" error={errors.religion}>
                    <select
                      value={values.religion}
                      onChange={(e) => setValue("religion", e.target.value)}
                      disabled={loading}
                      className={selectClassName}
                    >
                      <option value="">Pilih</option>
                      {AGAMA_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Status Perkawinan" error={errors.maritalStatus}>
                    <select
                      value={values.maritalStatus}
                      onChange={(e) => setValue("maritalStatus", e.target.value)}
                      disabled={loading}
                      className={selectClassName}
                    >
                      <option value="">Pilih</option>
                      <option value="BELUM_KAWIN">Belum Kawin</option>
                      <option value="KAWIN">Kawin</option>
                      <option value="CERAI_HIDUP">Cerai Hidup</option>
                      <option value="CERAI_MATI">Cerai Mati</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Pendidikan" error={errors.education}>
                    <select
                      value={values.education}
                      onChange={(e) => setValue("education", e.target.value)}
                      disabled={loading}
                      className={selectClassName}
                    >
                      <option value="">Pilih</option>
                      {PENDIDIKAN_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Pekerjaan" error={errors.occupation}>
                    <select
                      value={values.occupation}
                      onChange={(e) => setValue("occupation", e.target.value)}
                      disabled={loading}
                      className={selectClassName}
                    >
                      <option value="">Pilih</option>
                      {PEKERJAAN_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <Field label="Alamat Domisili" error={errors.address}>
                  <Input
                    value={values.address}
                    onChange={(e) => setValue("address", e.target.value.slice(0, 255))}
                    placeholder="Alamat lengkap"
                    className={inputClassName}
                    disabled={loading}
                  />
                </Field>

                <div className="grid grid-cols-3 gap-3">
                  <Field label="RT" error={errors.rt}>
                    <select
                      value={values.rt}
                      onChange={(e) => setValue("rt", e.target.value)}
                      disabled={loading}
                      className={selectClassName}
                    >
                      <option value="">Pilih</option>
                      {RT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="RW" error={errors.rw}>
                    <Input
                      value={values.rw}
                      onChange={(e) => setValue("rw", e.target.value.replace(/\D/g, "").slice(0, 3))}
                      placeholder="025"
                      className={inputClassName}
                      disabled={loading}
                    />
                  </Field>

                  <Field label="Status" error={errors.status}>
                    <select
                      value={values.status}
                      onChange={(e) => setValue("status", e.target.value as FormValues["status"])}
                      disabled={loading}
                      className={selectClassName}
                    >
                      <option value="PENDUDUK_TETAP">Tetap</option>
                      <option value="NGEKOST">Ngekost</option>
                    </select>
                  </Field>
                </div>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field
                    label="Nomor KK"
                    error={errors.kkNumber}
                    hint="Opsional. Isi jika ingin langsung terkait ke data KK."
                  >
                    <Input
                      inputMode="numeric"
                      value={values.kkNumber ?? ""}
                      onChange={(e) => setValue("kkNumber", e.target.value.replace(/\D/g, "").slice(0, 16) || undefined)}
                      placeholder="16 digit nomor KK"
                      className={inputClassName}
                      disabled={loading}
                    />
                  </Field>

                  <Field label="Hubungan Keluarga" error={errors.familyRelationship}>
                    <select
                      value={values.familyRelationship ?? ""}
                      onChange={(e) => setValue("familyRelationship", e.target.value || undefined)}
                      disabled={loading}
                      className={selectClassName}
                    >
                      <option value="">Opsional</option>
                      {FAMILY_RELATIONSHIP_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="rounded-3xl border border-[color:var(--border)] bg-white/80 p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-[color:var(--panel-on-brand-foreground)]">
                    Ringkasan pendaftaran
                  </h3>
                  <div className="mt-3">
                    <SummaryRow label="Username" value={values.username} />
                    <SummaryRow label="Email" value={values.email} />
                    <SummaryRow label="Nama lengkap" value={values.name} />
                    <SummaryRow label="NIK" value={values.nik} />
                    <SummaryRow
                      label="Tanggal lahir"
                      value={values.birthDate ? new Date(values.birthDate).toLocaleDateString("id-ID") : ""}
                    />
                    <SummaryRow label="Alamat" value={values.address} />
                    <SummaryRow label="RT / RW" value={values.rt && values.rw ? `${values.rt} / ${values.rw}` : ""} />
                    <SummaryRow
                      label="Status warga"
                      value={values.status === "NGEKOST" ? "Ngekost" : "Penduduk Tetap"}
                    />
                    <SummaryRow label="Nomor KK" value={values.kkNumber ?? "-"} />
                    <SummaryRow label="Hubungan keluarga" value={values.familyRelationship ?? "-"} />
                  </div>
                </div>
              </>
            ) : null}

            <div className="flex items-center gap-3 pt-2">
              {step < 4 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="h-12 flex-1 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-[color-mix(in_srgb,var(--primary),transparent_72%)] hover:bg-[color:var(--brand-700)]"
                >
                  Lanjut
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 flex-1 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-[color-mix(in_srgb,var(--primary),transparent_72%)] hover:bg-[color:var(--brand-700)]"
                >
                  {loading ? "Memproses..." : "Submit Pendaftaran"}
                </Button>
              )}
            </div>

            <p className="text-center text-[11px] leading-relaxed text-[color:var(--muted-foreground)]">
              Semua data tetap divalidasi penuh dan baru dikirim saat tombol submit akhir ditekan.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-[color:var(--panel-on-brand-foreground)]">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-[color:var(--muted-foreground)]">{hint}</p>
      ) : null}
    </div>
  );
}

const inputClassName =
  "h-12 rounded-2xl border-[color:var(--input)] bg-[color:var(--panel-on-brand)] px-4 text-[color:var(--panel-on-brand-foreground)] placeholder:text-[color:var(--muted-foreground)] focus-visible:ring-[color:var(--ring)]";

const selectClassName =
  "h-12 w-full rounded-2xl border border-[color:var(--input)] bg-[color:var(--panel-on-brand)] px-4 text-sm text-[color:var(--panel-on-brand-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]";
