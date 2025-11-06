"use client";

import ContractListScreen from "@/components/contracts/ContractListScreen";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useAuthStore } from "@/lib/store/auth";
import { useIsClient } from "@/hooks/use-is-client";

export default function ContractListPage() {
  const isClient = useIsClient();
  const { isAuthenticated } = useAuthGuard();
  const { user } = useAuthStore();

  if (!isClient || !isAuthenticated) {
    return null;
  }

  return <ContractListScreen viewerId={user?.id ?? null} />;
}
