"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/ui/page-header";

const schema = z.object({
  identifier: z.string().trim().min(3, "Username/email minimal 3 karakter"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

function getErrorMessage(value: unknown) {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  return null;
}

function readBetterAuthError(value: unknown) {
  if (!value || typeof value !== "object") return null;
  if (!("error" in value)) return null;

  const err = (value as { error?: unknown }).error;

  if (!err) return null;
  if (typeof err === "string") return err;

  if (typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }

  return "Terjadi kesalahan";
}

export default function SignInClient({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  const normalizedIdentifier = identifier.trim().toLowerCase();
  const isEmail = useMemo(() => normalizedIdentifier.includes("@"), [normalizedIdentifier]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = schema.safeParse({
      identifier: normalizedIdentifier,
      password,
    });

    if (!parsed.success) {
      toast({
        title: "Input tidak valid",
        description:
          parsed.error.issues[0]?.message ||
          "Cek kembali username/email dan password.",
        variant: "destructive",
      });

      return;
    }

    setLoading(true);

    try {
      if (isEmail) {
        const res = await authClient.signIn.email({
          email: parsed.data.identifier,
          password: parsed.data.password,
        });

        const err = readBetterAuthError(res);
        if (err) throw new Error(err);
      } else {
        const res = await authClient.signIn.username({
          username: parsed.data.identifier,
          password: parsed.data.password,
        });

        const err = readBetterAuthError(res);
        if (err) throw new Error(err);
      }

      const session = await authClient.getSession();
      const sessionErr = readBetterAuthError(session);

      if (sessionErr) throw new Error(sessionErr);

      const role = session?.data?.user?.role;

      toast({
        title: "Berhasil masuk",
        description: "Selamat datang kembali.",
        variant: "success",
      });

      if (role === "ADMIN") router.push(nextPath || "/admin");
      else router.push(nextPath || "/warga");
    } catch (e: unknown) {
      toast({
        title: "Gagal masuk",
        description: getErrorMessage(e) || "Cek username/email dan password.",
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
          title="Masuk ke Akun"
          variant="brand"
          className="border-b-0 px-6 pb-8"
          titleClassName="text-3xl font-extrabold leading-tight text-[color:var(--primary-foreground)]"
          descriptionClassName="text-sm text-[color:color-mix(in_srgb,var(--primary-foreground),transparent_18%)]"
          description="Belum punya akun?"
          rightSlot={
            <Button
              type="button"
              onClick={() => router.back()}
              size="icon"
              variant="secondary"
              className="rounded-full border border-[color:color-mix(in_srgb,var(--primary-foreground),transparent_84%)] bg-[color:color-mix(in_srgb,var(--primary-foreground),transparent_88%)] text-[color:var(--primary-foreground)] hover:bg-[color:color-mix(in_srgb,var(--primary-foreground),transparent_80%)]"
              aria-label="Kembali"
              disabled={loading}
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
          }
          bottomSlot={
            <Button
              type="button"
              onClick={() => router.push("/register")}
              variant="link"
              size="sm"
              className="h-auto px-0 py-0 text-sm font-semibold text-[color:var(--primary-foreground)] underline underline-offset-4 hover:text-[color:color-mix(in_srgb,var(--primary-foreground),transparent_14%)]"
              disabled={loading}
            >
              Daftar
            </Button>
          }
        />

        <section className="mt-auto rounded-t-[28px] border border-[color:var(--border)] bg-[color:var(--panel-on-brand)] px-6 pb-10 pt-6 text-[color:var(--panel-on-brand-foreground)] shadow-2xl">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label className="mb-2 block text-xs font-semibold text-[color:var(--panel-on-brand-foreground)]">
                Username / Email
              </Label>

              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.trimStart())}
                placeholder="contoh: warga01 atau warga@mail.com"
                className="h-auto rounded-xl border-[color:var(--input)] bg-[color:var(--panel-on-brand)] px-4 py-3.5 text-[color:var(--panel-on-brand-foreground)] placeholder:text-[color:var(--muted-foreground)] focus-visible:ring-[color:var(--ring)]"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div>
              <Label className="mb-2 block text-xs font-semibold text-[color:var(--panel-on-brand-foreground)]">
                Password
              </Label>

              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="h-auto rounded-xl border-[color:var(--input)] bg-[color:var(--panel-on-brand)] px-4 py-3.5 text-[color:var(--panel-on-brand-foreground)] placeholder:text-[color:var(--muted-foreground)] focus-visible:ring-[color:var(--ring)]"
                autoComplete={remember ? "current-password" : "off"}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="inline-flex select-none items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(checked) => setRemember(checked === true)}
                  className="rounded border-[color:var(--input)] text-[color:var(--primary-foreground)] focus-visible:ring-[color:var(--ring)] data-[state=checked]:border-[color:var(--primary)] data-[state=checked]:bg-[color:var(--primary)] data-[state=checked]:text-[color:var(--primary-foreground)]"
                  disabled={loading}
                />

                <Label
                  htmlFor="remember"
                  className="text-xs font-semibold text-[color:var(--muted-foreground)]"
                >
                  Ingat saya
                </Label>
              </div>

              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0 py-0 text-xs font-semibold text-[color:var(--primary)] hover:text-[color:var(--brand-700)]"
                disabled={loading}
              >
                Lupa password?
              </Button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-auto w-full rounded-xl bg-[color:var(--primary)] py-3.5 text-sm font-bold tracking-wide text-[color:var(--primary-foreground)] shadow-lg shadow-[color:color-mix(in_srgb,var(--primary),transparent_72%)] hover:bg-[color:var(--brand-700)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Memproses..." : "Masuk"}
            </Button>

            <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
              Dengan masuk, Anda menyetujui ketentuan layanan dan kebijakan privasi internal.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}