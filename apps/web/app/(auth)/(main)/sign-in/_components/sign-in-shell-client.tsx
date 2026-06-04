"use client";

import nextDynamic from "next/dynamic";

const SignInClient = nextDynamic(() => import("./sign-in-client"), {
  ssr: false,
  loading: () => <AuthPageSkeleton />,
});

export default function SignInShellClient({ nextPath }: { nextPath?: string }) {
  return <SignInClient nextPath={nextPath} />;
}

function AuthPageSkeleton() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-6 w-28 rounded bg-slate-200" />
          <div className="h-10 w-10 rounded-full border border-slate-200 bg-white" />
        </div>

        <section className="pb-8 pt-10">
          <div className="h-10 w-56 rounded-2xl bg-slate-200" />
          <div className="mt-3 h-4 w-64 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-52 rounded bg-slate-100" />
        </section>

        <section className="mt-auto rounded-[32px] border border-slate-200 bg-white px-6 pb-8 pt-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="space-y-4">
            <div className="h-14 rounded-[22px] bg-slate-100" />
            <div className="h-5 w-40 rounded bg-slate-100" />
            <div className="h-14 rounded-[20px] bg-slate-100" />
            <div className="h-14 rounded-[20px] bg-slate-100" />
            <div className="h-12 rounded-2xl bg-slate-200" />
          </div>
        </section>
      </div>
    </main>
  );
}
