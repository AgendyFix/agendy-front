import { useAuth } from "@/lib/hooks/useAuth";

/** True si el usuario es admin en la compañía activa. */
export function useIsAdmin(): boolean {
  const { user, currentCompany } = useAuth();
  return (
    user?.employee_profiles?.find((p) => p.company === currentCompany?.id)?.role === "admin"
  );
}
