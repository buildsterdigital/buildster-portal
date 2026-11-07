"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarLink({ href, label, soon }: { href: string; label: string; soon?: boolean }) {
  const active = usePathname().startsWith(href);
  if (soon) {
    return (
      <span className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-500">
        {label} <span className="text-[10px] uppercase tracking-wide">soon</span>
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 text-sm ${active ? "bg-orange-500 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
    >
      {label}
    </Link>
  );
}
