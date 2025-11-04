"use client";

import { useSearchParams } from "next/navigation";
import AuthScreen from "@/components/auth/AuthScreen";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const returnUrl = searchParams.get("returnUrl");
  const initialMode = mode === "signup" ? "signup" : "login";

  return <AuthScreen initialMode={initialMode} returnUrl={returnUrl || undefined} />;
}

