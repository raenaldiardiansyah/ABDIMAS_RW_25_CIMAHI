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

const schema = z.object({
  username: z.string().min(3).regex(/^[a-zA-Z0-9]+$/),
  email: z.string().email(),
  nik: z.string().regex(/^\d{16}$/),
  password: z.string().min(8),
});

function getErrorMessage(value: unknown) {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
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

    const parsed = schema.safeParse({ username, email, nik, password });
    if (!parsed.success) {
      const first =
        parsed.error.issues[0]?.message ||
        (nik.length !== 16 ? "NIK harus 16 digit" : "Input tidak valid");
      toast({ title: "Input tidak valid", description: first, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/identity/strict-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: parsed.data.username,
          email: parsed.data.email,
          password: parsed.data.password,
          nik: parsed.data.nik,
          fullName: fullName.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Gagal menyimpan identitas");
      }

      toast({ title: "Akun dibuat", description: "Pendaftaran berhasil. Lanjut ke portal warga.", variant: "success" });
      router.push("/warga");
    } catch (e: unknown) {
      toast({ title: "Gagal daftar", description: getErrorMessage(e) || "Silakan coba lagi.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[color:var(--brand-600)] text-white">
      <div className="mx-auto w-full max-w-md min-h-screen flex flex-col">
        <PageHeader
          title="Daftar Akun"
          variant="brand"
          className="border-b-0 px-6 pb-8"
          titleClassName="text-3xl font-extrabold leading-tight"
          descriptionClassName="text-sm"
          description="Sudah punya akun?"
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
              onClick={() => router.push("/sign-in")}
              variant="link"
              size="sm"
              className="h-auto px-0 py-0 text-sm font-semibold text-white underline underline-offset-4 hover:text-white/90"
            >
              Masuk
            </Button>
          }
        />

        <section className="mt-auto bg-[color:var(--panel-on-brand)] text-[color:var(--panel-on-brand-foreground)] rounded-t-[28px] px-6 pt-6 pb-10 shadow-2xl">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-2 block">Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 30))}
                  placeholder="min 3 karakter"
                  className="h-auto px-4 py-3.5 rounded-xl border-slate-200 focus-visible:ring-[color:var(--ring)]"
                  autoComplete="username"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-2 block">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="warga@mail.com"
                  className="h-auto px-4 py-3.5 rounded-xl border-slate-200 focus-visible:ring-[color:var(--ring)]"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-2 block">Nama Lengkap (opsional)</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama sesuai KTP"
                className="h-auto px-4 py-3.5 rounded-xl border-slate-200 focus-visible:ring-[color:var(--ring)]"
                autoComplete="name"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-2 block">NIK</Label>
              <Input
                inputMode="numeric"
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                placeholder="16 digit"
                className="h-auto px-4 py-3.5 rounded-xl border-slate-200 focus-visible:ring-[color:var(--ring)]"
                autoComplete="off"
              />
              {nik.length > 0 && <p className="text-[11px] text-slate-500 mt-1 ml-1">{nik.length}/16 digit</p>}
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-2 block">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="h-auto px-4 py-3.5 rounded-xl border-slate-200 focus-visible:ring-[color:var(--ring)]"
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-auto py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg bg-[color:var(--brand-600)] text-white"
            >
              {loading ? "Memproses..." : "Daftar"}
            </Button>

            <p className="text-[11px] text-slate-500 leading-relaxed pt-2">
              Pendaftaran digunakan untuk verifikasi identitas warga. Pastikan NIK dan email benar.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
