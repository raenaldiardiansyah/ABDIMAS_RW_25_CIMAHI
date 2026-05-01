"use client";

import nextDynamic from "next/dynamic";
import PageHeader from "@/components/ui/page-header";

const SignInClient = nextDynamic(() => import("./sign-in-client"), {
  ssr: false,
  loading: () => <AuthPageSkeleton />,
});

export default function SignInShellClient({ nextPath }: { nextPath?: string }) {
  return <SignInClient nextPath={nextPath} />;
}

function AuthPageSkeleton() {
  return (
    <main className="min-h-screen bg-[color:var(--brand-600)] text-white">
      <div className="mx-auto w-full max-w-md min-h-screen flex flex-col animate-pulse">
        <PageHeader
          title=" "
          variant="brand"
          className="border-b-0 px-6 pb-8"
          titleClassName="h-10 w-56 rounded bg-secondary text-transparent"
          descriptionClassName="h-4 w-64 rounded bg-secondary text-transparent"
          rightSlot={<div className="h-10 w-10 rounded-full border border-white/10 bg-secondary" />}
          bottomSlot={<div className="h-4 w-20 rounded bg-secondary" />}
        />

        <section className="mt-auto bg-[color:var(--panel-on-brand)] text-[color:var(--panel-on-brand-foreground)] rounded-t-[28px] px-6 pt-6 pb-10 shadow-2xl">
          <div className="space-y-4">
            <div className="h-12 rounded-xl bg-slate-100" />
            <div className="h-12 rounded-xl bg-slate-100" />
            <div className="h-11 rounded-xl bg-slate-200" />
          </div>
        </section>
      </div>
    </main>
  );
}
