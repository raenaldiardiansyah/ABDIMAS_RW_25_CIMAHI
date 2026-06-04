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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

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

const SIGN_IN_MODES = {
  citizen: {
    value: "citizen",
    title: "Masuk sebagai Warga",
    description: "Gunakan akun warga untuk mengakses layanan RW.",
    submitLabel: "Masuk sebagai Warga",
    helper: "Belum punya akun warga?",
    nextPath: "/warga",
  },
  admin: {
    value: "admin",
    title: "Masuk sebagai Admin",
    description: "Gunakan akun admin untuk mengelola portal RW.",
    submitLabel: "Masuk sebagai Admin",
    helper: "Butuh akun warga biasa?",
    nextPath: "/admin",
  },
} as const;

type SignInMode = keyof typeof SIGN_IN_MODES;

export default function SignInClient({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [mode, setMode] = useState<SignInMode>(nextPath?.startsWith("/admin") ? "admin" : "citizen");

  const normalizedIdentifier = identifier.trim().toLowerCase();
  const isEmail = useMemo(() => normalizedIdentifier.includes("@"), [normalizedIdentifier]);
  const activeMode = SIGN_IN_MODES[mode];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = schema.safeParse({
      identifier: normalizedIdentifier,
      password,
    });

    if (!parsed.success) {
      toast({
        title: "Input tidak valid",
        description: parsed.error.issues[0]?.message || "Cek kembali username/email dan password.",
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

      if (mode === "admin" && role !== "ADMIN") {
        await authClient.signOut();
        throw new Error("Akun ini tidak memiliki akses admin.");
      }

      toast({
        title: "Berhasil masuk",
        description: "Selamat datang kembali.",
        variant: "success",
      });

      const destination =
        mode === "admin"
          ? nextPath || activeMode.nextPath
          : role === "ADMIN"
            ? "/admin"
            : nextPath || activeMode.nextPath;
      window.location.assign(destination);
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
    <main className="min-h-screen bg-[#f8fafc] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold tracking-[-0.01em] text-slate-500">RW 25 Cimahi</div>
          <Button
            type="button"
            onClick={() => router.back()}
            size="icon"
            variant="outline"
            className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            aria-label="Kembali"
            disabled={loading}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        <section className="pb-8 pt-10">
          <h1 className="max-w-xs text-[2.45rem] font-bold leading-[1.02] tracking-[-0.055em] text-slate-950">
            Masuk ke Akun
          </h1>
          <p className="mt-4 max-w-sm text-[16px] leading-8 text-slate-500">
            Pilih mode akun dan masuk untuk mengakses layanan digital RW 25 Cimahi.
          </p>
        </section>

        <section className="mt-auto rounded-[32px] border border-slate-200 bg-white px-6 pb-8 pt-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-3">
              <Tabs value={mode} onValueChange={(value) => setMode(value as SignInMode)}>
                <TabsList className="h-auto w-full gap-1.5 rounded-[22px] border border-slate-200 bg-slate-50 p-1.5">
                  <TabsTrigger
                    value="citizen"
                    className="flex-1 rounded-[18px] px-3 py-3 text-[13px] font-semibold text-slate-500 data-[state=active]:bg-[color:var(--primary)] data-[state=active]:text-white"
                  >
                    Masuk sebagai Warga
                  </TabsTrigger>
                  <TabsTrigger
                    value="admin"
                    className="flex-1 rounded-[18px] px-3 py-3 text-[13px] font-semibold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  >
                    Masuk sebagai Admin
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <p className="text-sm leading-7 text-slate-500">{activeMode.description}</p>
            </div>

            <div>
              <Label className="mb-2 block text-xs font-semibold text-slate-800">Username / Email</Label>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.trimStart())}
                placeholder="contoh: warga01 atau warga@mail.com"
                className="h-auto rounded-[20px] border-slate-200 bg-white px-4 py-4 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[color:var(--ring)]"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div>
              <Label className="mb-2 block text-xs font-semibold text-slate-800">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="h-auto rounded-[20px] border-slate-200 bg-white px-4 py-4 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[color:var(--ring)]"
                autoComplete={remember ? "current-password" : "off"}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="inline-flex select-none items-center gap-2 text-xs text-slate-500">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(checked) => setRemember(checked === true)}
                  className="rounded border-slate-300 text-white focus-visible:ring-[color:var(--ring)] data-[state=checked]:border-[color:var(--primary)] data-[state=checked]:bg-[color:var(--primary)] data-[state=checked]:text-white"
                  disabled={loading}
                />
                <Label htmlFor="remember" className="text-xs font-semibold text-slate-500">
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
              className="h-auto w-full rounded-[22px] bg-[color:var(--primary)] py-4 text-sm font-semibold tracking-[-0.01em] text-white shadow-[0_16px_32px_rgba(37,99,235,0.22)] hover:bg-[color:var(--brand-700)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Memproses..." : activeMode.submitLabel}
            </Button>

            <div className="flex items-center justify-between gap-3 pt-2 text-[11px] leading-relaxed text-slate-400">
              <p className="max-w-[15rem]">Dengan masuk, Anda menyetujui ketentuan layanan dan kebijakan privasi internal.</p>
              <Button
                type="button"
                onClick={() => {
                  if (mode === "admin") {
                    setMode("citizen");
                    return;
                  }
                  router.push("/register");
                }}
                variant="link"
                size="sm"
                className="h-auto px-0 py-0 text-xs font-semibold text-[color:var(--primary)] hover:text-[color:var(--brand-700)]"
                disabled={loading}
              >
                {mode === "admin" ? "Masuk sebagai warga" : "Daftar"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
