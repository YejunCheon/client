"use client";

import ContractListScreen from "@/components/contracts/ContractListScreen";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useAuthStore } from "@/lib/store/auth";

export default function ContractListPage() {
  const { isAuthenticated } = useAuthGuard();
  const { user } = useAuthStore();

  if (!isAuthenticated) {
    return null;
  }

  return <ContractListScreen viewerId={user?.id ?? null} />;
}
