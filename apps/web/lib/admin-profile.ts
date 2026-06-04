type SessionUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export type AdminProfile = {
  name: string;
  email: string;
  roleLabel: string;
  initials: string;
  avatarClassName: string;
};

export function getAdminProfile(user?: SessionUser | null): AdminProfile {
  const name = user?.name?.trim() || "Admin RW 25";
  const email = user?.email?.trim() || "admin@rw25.local";
  const role = user?.role === "ADMIN" ? "Administrator" : "User";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "A";

  return {
    name,
    email,
    roleLabel: role,
    initials,
    avatarClassName: "bg-primary",
  };
}
