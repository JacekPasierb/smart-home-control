export type Role = "user" | "admin";

export type AuthedUser = {
  id: string;
  role: Role;
};

// MVP: ownership w pamięci (ETAP 3 -> DB)
const HOME_OWNERS: Record<string, string[]> = {
  "123": ["u1"],
  "456": ["a1"],
};

export function canAccessHome(user: AuthedUser, homeId: string) {
  if (user.role === "admin") return true;
  const owners = HOME_OWNERS[homeId] || [];
  return owners.includes(user.id);
}
