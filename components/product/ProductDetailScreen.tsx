
'use client';

import { useParams } from 'next/navigation';

export default function ProductDetailScreen() {
  const params = useParams();
  const { productId } = params;

  return (
    <div>
      <h1>Product Detail Page</h1>
      <p>Product ID: {productId}</p>
    </div>
  );
}
