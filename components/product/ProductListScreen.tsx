"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useProductsList } from "@/hooks/use-products";
import { normalizeImageUrl } from "@/lib/utils";
import type { Product, ProductListResponse } from "@/types";
import { cn } from "@/lib/utils";

type SortOption = "latest" | "priceLow" | "priceHigh";

const img5 = "/assets/7aa7c9611c3f8ff422da5e3f2517977e63048d54.png";
const imgVectorStroke = "/assets/c76b9efec1aaf6868b3f07b078748d9f98bef3d9.svg";
const imgVectorStroke1 = "/assets/b0adf90a52df30c2883ca7ed591c1058a437da47.svg";

function IconIoniconsOutlineSearchOutline({ className }: { className?: string }) {
  return (
    <div className={className} data-name="icon / ionicons / outline / search-outline" data-node-id="55:585">
      <div className="absolute inset-[9.38%_23.01%_23.01%_9.38%]" data-name="Vector (Stroke)" data-node-id="55:586">
        <img alt="" className="block max-w-none size-full" src={imgVectorStroke} />
      </div>
      <div className="absolute inset-[62.95%_9.38%_9.38%_62.95%]" data-name="Vector (Stroke)" data-node-id="55:587">
        <img alt="" className="block max-w-none size-full" src={imgVectorStroke1} />
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`}>
      <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0" data-name="상품카드">
        <div className="[grid-area:1_/_1] bg-[var(--white,#f9f9f9)] h-[405px] ml-0 mt-[2.5px] rounded-[28px] w-[319px]" />
        <div className="[grid-area:1_/_1] h-[305px] ml-px mt-0 relative rounded-tl-[28px] rounded-tr-[28px] w-[318px]" data-name="상품사진">
          <img
            alt={product.productName}
            className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-tl-[28px] rounded-tr-[28px] size-full"
            src={normalizeImageUrl(product.productImage) || img5}
          />
        </div>
        <div className="[grid-area:1_/_1] box-border content-stretch flex flex-col gap-[6px] items-center justify-center ml-[15px] mt-[312.5px] relative w-[289px]" data-name="카드 내용">
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0 w-full">
            <p className="[grid-area:1_/_1] [white-space-collapse:collapse] font-['Inter:Regular','Noto_Sans_KR:Regular',sans-serif] font-normal leading-[24px] ml-0 mt-0 not-italic overflow-ellipsis overflow-hidden relative text-[16px] text-[color:var(--black,#222222)] text-nowrap w-[289px]">{product.productName}</p>
          </div>
          <div className="content-stretch flex items-center justify-between leading-[0] relative shrink-0 w-full">
            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
              <div className="[grid-area:1_/_1] box-border content-stretch flex font-bold items-end justify-between ml-0 mt-0 not-italic relative text-[color:var(--black,#222222)] text-nowrap w-[76px] whitespace-pre">
                <p className="font-['Inter:Bold',sans-serif] leading-[24px] relative shrink-0 text-[16px]">
                  {(() => {
                    const numericPrice = Number(product.price);
                    return Number.isNaN(numericPrice)
                      ? product.price
                      : numericPrice.toLocaleString();
                  })()}
                </p>
                <p className="font-['Inter:Bold','Noto_Sans_KR:Bold',sans-serif] leading-[22px] relative shrink-0 text-[15px]">원</p>
              </div>
            </div>
            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
              <div className="[grid-area:1_/_1] box-border content-stretch flex font-normal items-center justify-between leading-[20px] ml-0 mt-0 not-italic relative text-[14px] text-[color:var(--darkgrey,#767676)] text-nowrap w-[44px] whitespace-pre">
                <p className="font-['Inter:Regular',sans-serif] relative shrink-0">20</p>
                <p className="font-['Inter:Regular','Noto_Sans_KR:Regular',sans-serif] relative shrink-0">분전</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ProductListScreen() {
  const { data: productsData, isLoading, isError } = useProductsList<ProductListResponse>();
  const [sortOption, setSortOption] = useState<SortOption>("latest");

  // 정렬된 상품 목록
  const sortedProducts = useMemo(() => {
    if (!productsData?.products) return [];

    const products = [...productsData.products];

    switch (sortOption) {
      case "priceLow":
        return products.sort((a, b) => {
          const priceA = Number(a.price) || 0;
          const priceB = Number(b.price) || 0;
          return priceA - priceB;
        });
      case "priceHigh":
        return products.sort((a, b) => {
          const priceA = Number(a.price) || 0;
          const priceB = Number(b.price) || 0;
          return priceB - priceA;
        });
      case "latest":
      default:
        return products; // API에서 받은 순서 그대로 (최신순)
    }
  }, [productsData?.products, sortOption]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error fetching products</div>;
  }

  return (
    <div className="w-full py-10" data-name="상품 목록 페이지">
      <div className="box-border content-stretch flex flex-col gap-[26px] items-center px-[15px] py-0 w-full" data-node-id="103:723">
        <div className="content-stretch flex items-center justify-between leading-[0] relative shrink-0 w-full" data-name="검색 결과 및 필터" data-node-id="55:580">
          <div className="flex items-center gap-1 text-[18px] leading-[26px]" data-node-id="55:433">
            <span className="font-bold text-[#2487f8]">전체 상품</span>
            <span className="font-normal text-[#222222]">목록</span>
            <span className="font-normal text-[#767676]">{sortedProducts.length}건</span>
          </div>
          <div className="flex gap-[11px] items-center text-[18px] leading-[26px]" data-node-id="55:574">
            <button
              type="button"
              onClick={() => setSortOption("latest")}
              className={cn(
                "relative shrink-0 transition-colors",
                sortOption === "latest"
                  ? "font-bold text-[#2487f8]"
                  : "font-normal text-[#222222] hover:text-[#2487f8]"
              )}
            >
              최신순
            </button>
            <button
              type="button"
              onClick={() => setSortOption("priceLow")}
              className={cn(
                "relative shrink-0 transition-colors",
                sortOption === "priceLow"
                  ? "font-bold text-[#2487f8]"
                  : "font-normal text-[#222222] hover:text-[#2487f8]"
              )}
            >
              저가순
            </button>
            <button
              type="button"
              onClick={() => setSortOption("priceHigh")}
              className={cn(
                "relative shrink-0 transition-colors",
                sortOption === "priceHigh"
                  ? "font-bold text-[#2487f8]"
                  : "font-normal text-[#222222] hover:text-[#2487f8]"
              )}
            >
              고가순
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-[26px]">
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
