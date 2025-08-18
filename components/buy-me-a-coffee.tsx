"use client";

import { Heart, Coffee } from "@phosphor-icons/react";
import Link from "next/link";

export function SupportSection() {
  return (
    <>
    <div className="rounded-b-3xl p-4 pb-15 md:p-6 shadow-sm text-sm md:text-base max-w-xl mx-auto">
      <p className="text-bookWhite mt-1 text-center font-serif">
        This project is a labor of love, brewed with a lot of passion and late nights. If you’d like to support us, consider sharing a warm matcha.
      </p>
      <div className="flex justify-center">
        <Link
          href="https://ko-fi.com/luztunon"
          className="text-xs flex mt-2 bg-accent-variant/80 items-center text-center text-bookWhite font-medium px-4 py-1.5 rounded-full hover:bg-[#b1c5a0] transition-colors"
        >
          <Coffee size={16} weight="fill" className="text-bookWhite mr-1" />
          Support with a matcha
        </Link>
      </div>
      
      {/* <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
        <div className="flex-shrink-0 bg-[#C8D6B9] rounded-full p-3">
          <Heart size={28} weight="fill" className="text-primary" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <p className="font-semibold text-bookBlack">
            Like what we're building?
          </p>
          <p className="text-secondary mt-1">
            This project is a labor of love, brewed with a lot of passion and late nights. If you’d like to support us during this early stage, consider sharing a warm matcha. Every bit helps and means a lot 💚
          </p>
          <Link
            href="https://ko-fi.com/luztunon"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 bg-[#C8D6B9] text-bookBlack font-medium px-4 py-2 rounded-full hover:bg-[#b1c5a0] transition-colors"
          >
            <Coffee size={28} weight="fill" className="text-accent-variant" />
            ☕ Buy me a matcha
          </Link>
        </div>
      </div> */}
    </div>
    </>
  );
}