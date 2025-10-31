"use client";

import React from "react";

const img = "/assets/e6982e655aba63c7b53ddebd8ffc1e576c11dd28.svg";

export default function Footer() {
  return (
    <footer className="w-full bg-[#767676] py-6 text-white">
      <div className="mx-auto w-full max-w-[1512px] px-5">
        <div className="flex items-center justify-between">
          <div className="h-[100px] w-[90px]"><img alt="" src={img} className="h-[51px] w-[90px]" /></div>
          <div className="text-right text-sm">dealchain @ 2025. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}


