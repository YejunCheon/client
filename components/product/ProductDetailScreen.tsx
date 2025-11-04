'use client';

import { useParams } from 'next/navigation';
import { useProduct } from '@/hooks/use-products';

export default function ProductDetailScreen() {
  const params = useParams();
  const { productId } = params;
  const { data: productData, isLoading, isError } = useProduct(Number(productId));

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error fetching product</div>;
  }

  return (
    <div>
      <h1>{productData?.product.productName}</h1>
      <p>{productData?.product.description}</p>
      <p>{productData?.product.price}원</p>
    </div>
  );
}