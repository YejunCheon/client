'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProduct } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowLeft, Heart, Send } from 'lucide-react';
import Image from 'next/image';
import { useChat } from '@/hooks/use-chat';
import { useAuthStore } from '@/lib/store/auth';
import { useState } from 'react';

export default function ProductDetailScreen() {
  const params = useParams();
  const router = useRouter();
  const { productId } = params;
  const { data: productData, isLoading, isError } = useProduct(Number(productId));
  const { user } = useAuthStore();
  const { createRoom } = useChat(user?.id?.toString() || null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const handleChatClick = async () => {
    if (!productData?.product || !user?.id) {
      return;
    }

    setIsCreatingChat(true);
    try {
      const result = await createRoom({
        seller: productData.product.memberId.toString(),
        buyer: user.id.toString(),
        productId: productData.product.id.toString(),
      });
      
      if (result?.roomId) {
        router.push(`/chat/${result.roomId}`);
      }
    } catch (error) {
      console.error('Failed to create chat room:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-10">
        <div className="mx-auto max-w-[1248px] px-5">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-32 bg-slate-200 rounded" />
            <div className="flex gap-[113px]">
              <div className="h-[447px] w-[467px] bg-slate-200 rounded" />
              <div className="space-y-4 flex-1">
                <div className="h-8 bg-slate-200 rounded w-3/4" />
                <div className="h-6 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-200 rounded w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !productData?.product) {
    return (
      <div className="w-full py-10">
        <div className="mx-auto max-w-[1248px] px-5">
          <div className="border border-red-100 bg-red-50/80 rounded-lg p-12 text-center">
            <p className="text-lg font-semibold text-red-700">
              상품 정보를 불러오지 못했습니다.
            </p>
            <p className="text-sm text-red-600 mt-2">
              잠시 후 다시 시도해 주세요.
            </p>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const product = productData.product;
  const numericPrice = Number(product.price);
  const formattedPrice = Number.isNaN(numericPrice)
    ? product.price
    : numericPrice.toLocaleString();
  const isOwner = Boolean(user?.id && user.id === String(product.memberId));

  return (
    <div className="w-full py-[22px]">
      <div className="mx-auto max-w-[1248px] px-[132px]">
        <div className="flex flex-col gap-[40px]">
          {/* Main Product Info */}
          <div className="flex gap-[113px] items-end">
            {/* Product Image */}
            <div className="relative h-[447px] w-[467px] shrink-0 overflow-hidden rounded-lg">
              <Image
                src={product.productImage || '/assets/mock_product_img.png'}
                alt={product.productName}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Product Details */}
            <div className="flex flex-col gap-[98px] flex-1">
              <div className="flex flex-col gap-[34px]">
                {/* Title and Price */}
                <div className="flex flex-col gap-[36px]">
                  <div className="flex flex-col gap-[22px]">
                    <h1 className="text-[36px] font-bold leading-[44px] text-[#222]">
                      {product.productName}
                    </h1>
                    <div className="flex items-end gap-2">
                      <span className="text-[36px] font-bold leading-[44px] text-[#222]">
                        {formattedPrice}
                      </span>
                      <span className="text-[36px] font-bold leading-[44px] text-[#222] mb-[2px]">
                        원
                      </span>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="h-px bg-[#dedede] w-full" />
                </div>

                {/* Product Info */}
                <div className="flex flex-col gap-[17px]">
                  <div className="flex gap-[6px] items-center text-[18px] text-[#767676]">
                    <span className="w-[82px]">카테고리</span>
                    <span className="w-[82px]">키보드</span>
                  </div>
                  <div className="flex gap-[6px] items-center text-[18px] text-[#767676]">
                    <span className="w-[82px]">상품 상태</span>
                    <span className="w-[119px]">사용감 없음</span>
                  </div>
                  <div className="flex gap-[6px] items-center text-[18px] text-[#767676]">
                    <span className="w-[82px]">배송비</span>
                    <span className="w-[119px]">3800원</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-[36px] items-center justify-end">
                <button
                  className="bg-[#acacac] rounded-[15px] px-5 py-[11px] flex items-center gap-2 text-white hover:bg-[#999] transition-colors"
                >
                  <span className="text-[18px] font-bold leading-[26px]">찜하기</span>
                  <Heart className="h-4 w-4 fill-white" />
                </button>
                {!isOwner ? (
                  <button
                    onClick={handleChatClick}
                    disabled={isCreatingChat || !user}
                    className="bg-[#2487f8] rounded-[15px] px-5 py-[11px] flex items-center gap-2 text-white hover:bg-[#1e6fd8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-[18px] font-bold leading-[26px]">
                      {isCreatingChat ? '연결 중...' : '연락하기'}
                    </span>
                    <Send className="h-6 w-6" />
                  </button>
                ) : (
                  <div className="bg-slate-100 rounded-[15px] px-5 py-[11px] text-center">
                    <span className="text-sm text-[#767676]">
                      내가 등록한 상품입니다.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#dedede] w-full" />

          {/* Product Description */}
          <div className="flex flex-col gap-[30px] max-w-[457px]">
            <h2 className="text-[22px] font-bold leading-[30px] text-[#222]">
              상품정보
            </h2>
            <div className="text-[18px] leading-[26px] text-[#222] whitespace-pre-wrap">
              {product.description || '상품 설명이 없습니다.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
