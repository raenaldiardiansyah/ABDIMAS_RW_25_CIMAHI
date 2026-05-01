import SignInShellClient from "./_components/sign-in-shell-client";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  return <SignInShellClient nextPath={sp.next} />;
}
