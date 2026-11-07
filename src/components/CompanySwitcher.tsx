"use client";

import { useRouter, usePathname } from "next/navigation";
import type { MyCompany } from "@/lib/company";

// Dropdown that keeps you on the same section when you switch company.
export function CompanySwitcher({ current, companies }: { current: string; companies: MyCompany[] }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <select
      aria-label="Switch company"
      className="w-full truncate rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
      value={current}
      onChange={(e) => {
        const value = e.target.value;
        if (value === "__new") return router.push("/companies/new");
        const section = pathname.split("/")[3] ?? "dashboard";
        router.push(`/c/${value}/${section}`);
      }}
    >
      {companies.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
      <option value="__new">+ Add company</option>
    </select>
  );
}
