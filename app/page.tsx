"use client";

import LandingPage from "@/components/home/LandingPage";
import { useIsClient } from "@/hooks/use-is-client";

export default function Home() {
  const isClient = useIsClient();

  if (!isClient) {
    return null;
  }

  return <LandingPage />;
}
