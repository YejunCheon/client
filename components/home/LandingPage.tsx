"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Shield, FileText, PenTool } from "lucide-react";
import { useProductsList } from "@/hooks/use-products";
import InteractiveDotBackground from "./InteractiveDotBackground";

export default function LandingPage() {
  const { data: productsData, isLoading } = useProductsList();

  const featuredProducts = useMemo(() => {
    const products = productsData?.products ?? [];
    const sorted = [...products].sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });
    return sorted.slice(0, 4);
  }, [productsData?.products]);

  const formatPrice = (price: string) => {
    const parsed = Number(price);
    return Number.isNaN(parsed) ? price : parsed.toLocaleString();
  };

  const formatUpdatedAt = (updatedAt?: string) => {
    if (!updatedAt) {
      return "방금 전";
    }
    const date = new Date(updatedAt);
    if (Number.isNaN(date.getTime())) {
      return updatedAt;
    }

    const diff = Date.now() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) return "방금 전";
    if (diff < hour) return `${Math.floor(diff / minute)}분 전`;
    if (diff < day) return `${Math.floor(diff / hour)}시간 전`;
    return `${Math.floor(diff / day)}일 전`;
  };

  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gradient-to-br from-blue-50 to-white overflow-hidden">
      {/* 인터랙티브 도트 배경 */}
      <InteractiveDotBackground
        dotSize={3}
        spacing={35}
        maxDistance={200}
        baseOpacity={0.08}
        maxOpacity={0.85}
      />
      
      {/* 히어로 섹션 */}
      <section className="w-full py-60 relative z-10">
        <div className="mx-auto max-w-[1200px] px-5 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-[#222] mb-6">
            안전한 중고거래를 위한
            <br />
            <span className="text-[#2487f8]">AI 계약서 자동 생성</span>
          </h1>
          <p className="text-xl md:text-2xl text-[#767676] mb-10 max-w-2xl mx-auto">
            채팅만으로 계약서가 자동 생성되고, 전자서명으로 거래를 안전하게 보장하세요
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/product/list"
              className="bg-[#2487f8] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl"
            >
              상품 둘러보기
            </Link>
            <Link
              href="/product/create"
              className="bg-white text-[#2487f8] border-2 border-[#2487f8] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-all"
            >
              내 상품 판매하기
            </Link>
          </div>
        </div>
      </section>

      {/* 주요 기능 소개 */}
      <section className="w-full py-20 relative z-10">
        <div className="mx-auto max-w-[1200px] px-5">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#222] mb-16">
            DealChain은 안전합니다
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* AI 계약서 자동 생성 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="bg-[#2487f8]/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-[#2487f8]" />
              </div>
              <h3 className="text-2xl font-bold text-[#222] mb-4">AI 계약서 자동 생성</h3>
              <p className="text-[#767676] text-lg leading-relaxed">
                채팅 내용을 AI가 분석하여 계약서 초안을 자동으로 생성합니다. 
                복잡한 법률 용어는 전문가가 처리하니 걱정 마세요.
              </p>
            </div>

            {/* 전자서명 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="bg-[#2487f8]/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <PenTool className="w-8 h-8 text-[#2487f8]" />
              </div>
              <h3 className="text-2xl font-bold text-[#222] mb-4">간편한 전자서명</h3>
              <p className="text-[#767676] text-lg leading-relaxed">
                클릭 몇 번으로 전자서명 완료. 본인인증 후 서명하면 
                법적 효력이 있는 계약서가 완성됩니다.
              </p>
            </div>

            {/* 안전한 거래 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="bg-[#2487f8]/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-[#2487f8]" />
              </div>
              <h3 className="text-2xl font-bold text-[#222] mb-4">안전한 거래 보장</h3>
              <p className="text-[#767676] text-lg leading-relaxed">
                PDF 암호화와 해시 기반 무결성 검증으로 계약서가 
                변조되지 않음을 보장합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 최신 상품 그리드 */}
      <section className="w-full py-16 pb-20 relative z-10">
        <div className="mx-auto max-w-[1512px] px-5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-[#222]">✨ 최신 상품</h2>
            <Link href="/product/list" className="text-[#2487f8] hover:underline text-lg">
              전체보기 →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-[#f9f9f9] rounded-[28px] h-[405px] animate-pulse"
                >
                  <div className="h-[305px] bg-[#ececec]" />
                  <div className="p-4 space-y-4">
                    <div className="h-4 bg-[#e0e0e0] rounded" />
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-20 bg-[#e0e0e0] rounded" />
                      <div className="h-4 w-12 bg-[#e0e0e0] rounded" />
                    </div>
                  </div>
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="bg-[#f9f9f9] rounded-[28px] h-[405px] relative overflow-hidden shadow-md hover:shadow-xl transition-all group"
                >
                  <div className="h-[305px] relative overflow-hidden">
                    <img
                      alt={product.productName}
                      src={product.productImage || "/assets/mock_product_img.png"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-[16px] font-normal text-[#222] mb-2 line-clamp-2">
                      {product.productName}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-end gap-1">
                        <span className="text-[16px] font-bold text-[#222]">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-[15px] font-bold text-[#222] mb-0.5">원</span>
                      </div>
                      <span className="text-[14px] text-[#767676]">
                        {formatUpdatedAt(product.updatedAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-4 flex min-h-[200px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#dcdcdc] bg-white">
                <p className="text-lg font-semibold text-[#444]">등록된 상품이 없습니다.</p>
                <p className="text-sm text-[#777] mt-2">첫 번째 상품을 등록해 보세요!</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
