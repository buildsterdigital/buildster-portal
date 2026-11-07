import { getCompanyContext } from "@/lib/company";

const TILES = [
  { group: "Quotes", label: "Pending" },
  { group: "Quotes", label: "Unsent" },
  { group: "Invoices", label: "Unpaid" },
  { group: "Jobs", label: "To book" },
  { group: "Jobs", label: "In progress" },
  { group: "Jobs", label: "Awaiting approval" },
];

export default async function DashboardPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { company, user } = await getCompanyContext(companyId);
  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm text-slate-500">{company.name}</p>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Hi {firstName}, here&apos;s today</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {TILES.map((t) => (
          <div key={t.group + t.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t.group}</p>
            <p className="text-sm text-slate-700">{t.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">0</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-500">
        Figures fill in as deals, quotes, invoices and jobs are added in the next phases.
      </p>
    </div>
  );
}
