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
  identifier: z.string().min(3),
  password: z.string().min(8),
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

  const isEmail = useMemo(() => identifier.includes("@"), [identifier]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = schema.safeParse({ identifier, password });
    if (!parsed.success) {
      toast({ title: "Input tidak valid", description: "Cek kembali username/email dan password.", variant: "destructive" });
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

      toast({ title: "Berhasil masuk", description: "Selamat datang kembali.", variant: "success" });

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
    <main className="min-h-screen bg-[color:var(--brand-600)] text-white">
      <div className="mx-auto w-full max-w-md min-h-screen flex flex-col">
        <PageHeader
          title="Masuk ke Akun"
          variant="brand"
          className="border-b-0 px-6 pb-8"
          titleClassName="text-3xl font-extrabold leading-tight"
          descriptionClassName="text-sm"
          description="Belum punya akun?"
          rightSlot={
            <Button
              type="button"
              onClick={() => router.back()}
              size="icon"
              variant="secondary"
              className="rounded-full border border-white/15"
              aria-label="Kembali"
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
              className="h-auto px-0 py-0 text-sm font-semibold text-white underline underline-offset-4 hover:text-white/90"
            >
              Daftar
            </Button>
          }
        />

        <section className="mt-auto bg-[color:var(--panel-on-brand)] text-[color:var(--panel-on-brand-foreground)] rounded-t-[28px] px-6 pt-6 pb-10 shadow-2xl">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-2 block">Username / Email</Label>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.trimStart())}
                placeholder="contoh: warga01 atau warga@mail.com"
                className="h-auto px-4 py-3.5 rounded-xl border-slate-200 focus-visible:ring-[color:var(--ring)]"
                autoComplete="username"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-2 block">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="h-auto px-4 py-3.5 rounded-xl border-slate-200 focus-visible:ring-[color:var(--ring)]"
                autoComplete={remember ? "current-password" : "off"}
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="inline-flex items-center gap-2 text-xs text-slate-600 select-none">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(checked) => setRemember(checked === true)}
                  className="rounded border-input data-[state=checked]:border-[color:var(--brand-600)] data-[state=checked]:bg-[color:var(--brand-600)] data-[state=checked]:text-white focus-visible:ring-[color:var(--ring)]"
                />
                <Label htmlFor="remember" className="text-xs font-semibold text-slate-600">
                  Ingat saya
                </Label>
              </div>

              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0 py-0 text-xs font-semibold text-[color:var(--brand-600)] hover:opacity-90"
              >
                Lupa password?
              </Button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-auto py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg bg-[color:var(--brand-600)] text-white"
            >
              {loading ? "Memproses..." : "Masuk"}
            </Button>

            <p className="text-[11px] text-slate-500 leading-relaxed pt-2">
              Dengan masuk, Anda menyetujui ketentuan layanan dan kebijakan privasi internal.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
