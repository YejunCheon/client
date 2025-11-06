"use client";

import { useSearchParams } from "next/navigation";
import AuthScreen from "@/components/auth/AuthScreen";
import { useIsClient } from "@/hooks/use-is-client";

export default function AuthPage() {
  const isClient = useIsClient();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const returnUrl = searchParams.get("returnUrl");
  const initialMode = mode === "signup" ? "signup" : "login";

  if (!isClient) {
    return null;
  }

  return <AuthScreen initialMode={initialMode} returnUrl={returnUrl || undefined} />;
}
