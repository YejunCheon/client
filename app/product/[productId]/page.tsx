"use client";

import ProductDetailScreen from "@/components/product/ProductDetailScreen";
import { useIsClient } from "@/hooks/use-is-client";

export default function Page() {
  const isClient = useIsClient();

  if (!isClient) {
    return null;
  }

  return <ProductDetailScreen />;
}
