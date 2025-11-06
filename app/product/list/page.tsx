"use client";

import ProductListScreen from "@/components/product/ProductListScreen";
import { useIsClient } from "@/hooks/use-is-client";

export default function Page() {
  const isClient = useIsClient();

  if (!isClient) {
    return null;
  }

  return <ProductListScreen />;
}

