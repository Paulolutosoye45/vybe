"use client";

import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-10">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 flex flex-wrap items-center justify-between gap-5 text-sm text-inkdim">
        <div className="flex items-center gap-3">
          <Image src="/diav-logo.webp" alt="" width={52} height={46} className="opacity-75" />
          <span>December Issa Vybe — Access Is The Vybe.</span>
        </div>
        <div className="flex flex-wrap gap-6">
          <button className="hover:text-ink transition-colors underline decoration-dashed underline-offset-4">Terms &amp; Conditions</button>
          <button className="hover:text-ink transition-colors underline decoration-dashed underline-offset-4">Data Privacy Notice</button>
          <button className="hover:text-ink transition-colors underline underline-offset-4">Cookie preferences</button>
          <button className="hover:text-ink transition-colors underline underline-offset-4">Accessibility statement</button>
        </div>
      </div>
    </footer>
  );
}
