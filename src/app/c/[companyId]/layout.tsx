import { getCompanyContext, getMyCompanies } from "@/lib/company";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import { SidebarLink } from "@/components/SidebarLink";
import { canManageCompany, ROLE_LABELS } from "@/lib/roles";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const [{ user, role }, companies] = await Promise.all([getCompanyContext(companyId), getMyCompanies()]);
  const base = `/c/${companyId}`;
  const isAdmin = canManageCompany(role);

  const nav = (
    <nav className="flex flex-col gap-1">
      <SidebarLink href={`${base}/dashboard`} label="Dashboard" />
      <p className="mt-4 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sales</p>
      <SidebarLink href={`${base}/deals`} label="Sales board" soon />
      <SidebarLink href={`${base}/customers`} label="Customers" soon />
      <p className="mt-4 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Money</p>
      <SidebarLink href={`${base}/quotes`} label="Quotes" soon />
      <SidebarLink href={`${base}/invoices`} label="Invoices" soon />
      <p className="mt-4 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Work</p>
      <SidebarLink href={`${base}/jobs`} label="Jobs" soon />
      <SidebarLink href={`${base}/calendar`} label="Calendar" soon />
      <p className="mt-4 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Company</p>
      <SidebarLink href={`${base}/users`} label="Users" />
      {isAdmin && <SidebarLink href={`${base}/settings`} label="Settings" />}
    </nav>
  );

  const footer = (
    <div className="border-t border-slate-800 pt-4 text-sm">
      <p className="truncate text-slate-300">{user.email}</p>
      <p className="mb-3 text-xs text-slate-500">{role ? ROLE_LABELS[role] : ""}</p>
      <form action="/auth/signout" method="post">
        <button className="text-slate-400 hover:text-white">Sign out</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col gap-6 bg-slate-900 p-4 md:flex md:sticky md:top-0 md:h-screen">
        <div className="flex items-center gap-2 px-1">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-orange-500 font-bold text-white">B</div>
          <span className="font-semibold text-white">Buildster Portal</span>
        </div>
        <CompanySwitcher current={companyId} companies={companies} />
        <div className="flex-1 overflow-y-auto">{nav}</div>
        {footer}
      </aside>

      {/* Phone top bar with a fold-out menu */}
      <details className="bg-slate-900 p-3 md:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between text-white">
          <span className="font-semibold">Buildster Portal</span>
          <span className="rounded-lg border border-slate-700 px-3 py-1 text-sm">Menu</span>
        </summary>
        <div className="mt-3 space-y-4">
          <CompanySwitcher current={companyId} companies={companies} />
          {nav}
          {footer}
        </div>
      </details>

      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
