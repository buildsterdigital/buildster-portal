import Link from "next/link";
import { getMyCompanies } from "@/lib/company";
import { ROLE_LABELS } from "@/lib/roles";

export default async function CompaniesPage() {
  const companies = await getMyCompanies();
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Your companies</h1>
        <Link href="/companies/new" className="btn-primary">Add company</Link>
      </div>
      <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {companies.map((c) => (
          <li key={c.id}>
            <Link href={`/c/${c.id}/dashboard`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
              <span className="font-medium text-slate-900">{c.name}</span>
              <span className="badge">{ROLE_LABELS[c.role]}</span>
            </Link>
          </li>
        ))}
        {companies.length === 0 && <li className="px-5 py-6 text-sm text-slate-500">No companies yet.</li>}
      </ul>
    </main>
  );
}
