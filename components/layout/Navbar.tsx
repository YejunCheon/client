"use client";

import React from "react";

const imgLogo = "/assets/2bef342664b11de04b2130dfa1c435984d5241b1.svg";
const imgVectorStroke = "/assets/c76b9efec1aaf6868b3f07b078748d9f98bef3d9.svg";
const imgVectorStroke1 = "/assets/b0adf90a52df30c2883ca7ed591c1058a437da47.svg";

function IconSearch({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="absolute inset-[9.38%_23.01%_23.01%_9.38%]">
        <img alt="" className="block max-w-none size-full" src={imgVectorStroke} />
      </div>
      <div className="absolute inset-[62.95%_9.38%_9.38%_62.95%]">
        <img alt="" className="block max-w-none size-full" src={imgVectorStroke1} />
      </div>
    </div>
  );
}

export default function Navbar() {
  return (
    <header className="w-full border-b border-blue-500/40">
      <div className="mx-auto w-full max-w-[1512px] flex items-center justify-between gap-6 px-5 py-4">
        <div className="h-[65px] w-[115px]">
          <img alt="DealChain" className="h-[65px] w-[115px]" src={imgLogo} />
        </div>
        <div className="relative w-full max-w-[601px]">
          <div className="h-[50px] w-full rounded-md border border-[#2487f8]" />
          <p className="pointer-events-none absolute left-[15px] top-[12px] text-[18px] leading-[26px] text-[#767676]">
            기계식 키보드
          </p>
          <IconSearch className="pointer-events-none absolute right-[13px] top-[13px] size-[24px]" />
        </div>
        <nav className="flex items-center gap-8 text-[18px] text-[#222]"><a>Home</a><a>내 계약서</a><a>진행중인 거래</a></nav>
      </div>
    </header>
  );
}
