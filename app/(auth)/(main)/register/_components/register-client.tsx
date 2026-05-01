"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/ui/page-header";

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

const fullNameSchema = z
  .string()
  .trim()
  .max(120, "Nama lengkap maksimal 120 karakter")
  .optional()
  .refine((value) => !value || value.length >= 2, {
    message: "Nama lengkap minimal 2 karakter",
  });

const schema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    nik: z
      .string()
      .trim()
      .regex(/^\d{16}$/, "NIK harus berisi 16 digit angka")
      .refine((value) => !isSuspiciousNikPattern(value), {
        message: "Format NIK tidak valid",
      })
      .refine((value) => isValidNikDatePart(value), {
        message: "Tanggal lahir pada NIK tidak valid",
      }),
    password: passwordSchema,
    fullName: fullNameSchema,
  })
  .refine(
    (data) => !passwordContainsUserData(data.password, data.email, data.username),
    {
      path: ["password"],
      message: "Password tidak boleh mengandung username atau email",
    }
  );

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

function getErrorMessage(value: unknown) {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  return "Silakan coba lagi.";
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

export default function RegisterClient() {
  const router = useRouter();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = schema.safeParse({
      username,
      email,
      nik,
      password,
      fullName: fullName.trim() || undefined,
    });

    if (!parsed.success) {
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
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: parsed.data.username,
          email: parsed.data.email,
          password: parsed.data.password,
          nik: parsed.data.nik,
          fullName: parsed.data.fullName,
        }),
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
    <main className="min-h-screen bg-[color:var(--primary)] text-[color:var(--primary-foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <PageHeader
          title="Daftar Akun"
          variant="brand"
          className="border-b-0 px-6 pb-8"
          titleClassName="text-3xl font-extrabold leading-tight text-[color:var(--primary-foreground)]"
          descriptionClassName="text-sm text-[color:color-mix(in_srgb,var(--primary-foreground),transparent_18%)]"
          description="Sudah punya akun?"
          rightSlot={
            <Button
              type="button"
              onClick={() => router.back()}
              size="icon"
              variant="secondary"
              className="rounded-full border border-[color:color-mix(in_srgb,var(--primary-foreground),transparent_84%)] bg-[color:color-mix(in_srgb,var(--primary-foreground),transparent_88%)] text-[color:var(--primary-foreground)] hover:bg-[color:color-mix(in_srgb,var(--primary-foreground),transparent_80%)]"
              aria-label="Kembali"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
          }
          bottomSlot={
            <Button
              type="button"
              onClick={() => router.push("/sign-in")}
              variant="link"
              size="sm"
              className="h-auto px-0 py-0 text-sm font-semibold text-[color:var(--primary-foreground)] underline underline-offset-4 hover:text-[color:color-mix(in_srgb,var(--primary-foreground),transparent_14%)]"
            >
              Masuk
            </Button>
          }
        />

        <section className="mt-auto rounded-t-[28px] border border-[color:var(--border)] bg-[color:var(--panel-on-brand)] px-6 pb-10 pt-6 text-[color:var(--panel-on-brand-foreground)] shadow-2xl">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block text-xs font-semibold text-[color:var(--panel-on-brand-foreground)]">
                  Username
                </Label>

                <Input
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value
                        .replace(/[^a-zA-Z0-9]/g, "")
                        .toLowerCase()
                        .slice(0, 30)
                    )
                  }
                  placeholder="min 3 karakter"
                  className="h-auto rounded-xl border-[color:var(--input)] bg-[color:var(--panel-on-brand)] px-4 py-3.5 text-[color:var(--panel-on-brand-foreground)] placeholder:text-[color:var(--muted-foreground)] focus-visible:ring-[color:var(--ring)]"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>

              <div>
                <Label className="mb-2 block text-xs font-semibold text-[color:var(--panel-on-brand-foreground)]">
                  Email
                </Label>

                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                  placeholder="warga@mail.com"
                  className="h-auto rounded-xl border-[color:var(--input)] bg-[color:var(--panel-on-brand)] px-4 py-3.5 text-[color:var(--panel-on-brand-foreground)] placeholder:text-[color:var(--muted-foreground)] focus-visible:ring-[color:var(--ring)]"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block text-xs font-semibold text-[color:var(--panel-on-brand-foreground)]">
                Nama Lengkap{" "}
                <span className="font-normal text-[color:var(--muted-foreground)]">
                  (opsional)
                </span>
              </Label>

              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value.slice(0, 120))}
                placeholder="Nama sesuai KTP"
                className="h-auto rounded-xl border-[color:var(--input)] bg-[color:var(--panel-on-brand)] px-4 py-3.5 text-[color:var(--panel-on-brand-foreground)] placeholder:text-[color:var(--muted-foreground)] focus-visible:ring-[color:var(--ring)]"
                autoComplete="name"
                disabled={loading}
              />
            </div>

            <div>
              <Label className="mb-2 block text-xs font-semibold text-[color:var(--panel-on-brand-foreground)]">
                NIK
              </Label>

              <Input
                inputMode="numeric"
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                placeholder="16 digit"
                className="h-auto rounded-xl border-[color:var(--input)] bg-[color:var(--panel-on-brand)] px-4 py-3.5 text-[color:var(--panel-on-brand-foreground)] placeholder:text-[color:var(--muted-foreground)] focus-visible:ring-[color:var(--ring)]"
                autoComplete="off"
                disabled={loading}
              />

              {nik.length > 0 && (
                <p className="ml-1 mt-1 text-[11px] text-[color:var(--muted-foreground)]">
                  {nik.length}/16 digit
                </p>
              )}
            </div>

            <div>
              <Label className="mb-2 block text-xs font-semibold text-[color:var(--panel-on-brand-foreground)]">
                Password
              </Label>

              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter, huruf dan angka"
                className="h-auto rounded-xl border-[color:var(--input)] bg-[color:var(--panel-on-brand)] px-4 py-3.5 text-[color:var(--panel-on-brand-foreground)] placeholder:text-[color:var(--muted-foreground)] focus-visible:ring-[color:var(--ring)]"
                autoComplete="new-password"
                disabled={loading}
              />

              <p className="ml-1 mt-1 text-[11px] text-[color:var(--muted-foreground)]">
                Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-auto w-full rounded-xl bg-primary py-3.5 text-sm font-bold tracking-wide text-primary-foreground shadow-lg shadow-[color-mix(in_srgb,var(--primary),transparent_72%)] hover:bg-[color:var(--brand-700)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Memproses..." : "Daftar"}
            </Button>

            <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
              Pendaftaran digunakan untuk verifikasi identitas warga. Pastikan NIK dan email benar.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}