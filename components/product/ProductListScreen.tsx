"use client";

import React from "react";
import Link from "next/link";
import { useProductsList } from "@/hooks/use-products";
import type { Product, ProductListResponse } from "@/types";

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
          <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-tl-[28px] rounded-tr-[28px] size-full" src={img5} />
        </div>
        <div className="[grid-area:1_/_1] box-border content-stretch flex flex-col gap-[6px] items-center justify-center ml-[15px] mt-[312.5px] relative w-[289px]" data-name="카드 내용">
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0 w-full">
            <p className="[grid-area:1_/_1] [white-space-collapse:collapse] font-['Inter:Regular','Noto_Sans_KR:Regular',sans-serif] font-normal leading-[24px] ml-0 mt-0 not-italic overflow-ellipsis overflow-hidden relative text-[16px] text-[color:var(--black,#222222)] text-nowrap w-[289px]">{product.productName}</p>
          </div>
          <div className="content-stretch flex items-center justify-between leading-[0] relative shrink-0 w-full">
            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
              <div className="[grid-area:1_/_1] box-border content-stretch flex font-bold items-end justify-between ml-0 mt-0 not-italic relative text-[color:var(--black,#222222)] text-nowrap w-[76px] whitespace-pre">
                <p className="font-['Inter:Bold',sans-serif] leading-[24px] relative shrink-0 text-[16px]">{parseInt(product.price).toLocaleString()}</p>
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
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[26px] not-italic place-items-start relative shrink-0 text-[18px] text-nowrap whitespace-pre" data-node-id="55:433">
            <p className="[grid-area:1_/_1] font-['Inter:Bold','Noto_Sans_KR:Bold',sans-serif] font-bold ml-0 mt-0 relative text-[#2487f8]" data-node-id="55:429">기계식 키보드</p>
            <p className="[grid-area:1_/_1] font-['Inter:Regular','Noto_Sans_KR:Regular',sans-serif] font-normal ml-[104px] mt-0 relative text-[color:var(--black,#222222)]" data-node-id="55:432">의 검색결과</p>
            <p className="[grid-area:1_/_1] font-['Inter:Regular','Noto_Sans_KR:Regular',sans-serif] font-normal ml-[200px] mt-0 relative text-[color:var(--darkgrey,#767676)]" data-node-id="55:579">{productsData?.product.length}건</p>
          </div>
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0" data-node-id="55:574">
            <div className="[grid-area:1_/_1] box-border content-stretch flex gap-[11px] items-center leading-[26px] ml-0 mt-0 not-italic relative text-[18px] text-nowrap whitespace-pre" data-node-id="55:578">
              <p className="font-['Inter:Bold','Noto_Sans_KR:Bold',sans-serif] font-bold relative shrink-0 text-[#2487f8]" data-node-id="55:575">최신순</p>
              <p className="font-['Inter:Regular','Noto_Sans_KR:Regular',sans-serif] font-normal relative shrink-0 text-[color:var(--black,#222222)]" data-node-id="55:576">저가순</p>
              <p className="font-['Inter:Regular','Noto_Sans_KR:Regular',sans-serif] font-normal relative shrink-0 text-[color:var(--black,#222222)]" data-node-id="55:577">고가순</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-[26px]">
          {productsData?.product.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
