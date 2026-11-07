import { redirect } from "next/navigation";
import { getCompanyContext } from "@/lib/company";
import { canManageCompany } from "@/lib/roles";
import { addListItem, removeListItem, saveCompany } from "./actions";

type Item = { id: string; name: string };

function Field({ name, label, value, type = "text" }: { name: string; label: string; value: string | number | null; type?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input name={name} type={type} defaultValue={value ?? ""} className="input" step={type === "number" ? "0.01" : undefined} />
    </label>
  );
}

function EditableList({ title, items, companyId, table }: { title: string; items: Item[]; companyId: string; table: "job_types" | "lead_sources" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 font-semibold text-slate-900">{title}</h2>
      <ul className="mb-3 flex flex-wrap gap-2">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-sm">
            {i.name}
            <form action={removeListItem.bind(null, companyId, table, i.id)}>
              <button aria-label={`Remove ${i.name}`} className="rounded-full px-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700">×</button>
            </form>
          </li>
        ))}
      </ul>
      <form action={addListItem.bind(null, companyId, table)} className="flex gap-2">
        <input name="name" required placeholder="Add new" className="input" />
        <button className="btn-secondary">Add</button>
      </form>
    </div>
  );
}

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { companyId } = await params;
  const { error, saved } = await searchParams;
  const { supabase, company, role } = await getCompanyContext(companyId);
  if (!canManageCompany(role)) redirect(`/c/${companyId}/dashboard`);

  const [{ data: stages }, { data: jobTypes }, { data: sources }] = await Promise.all([
    supabase.from("deal_stages").select("id, name, stage_group").eq("company_id", companyId).order("position"),
    supabase.from("job_types").select("id, name").eq("company_id", companyId).order("position").order("name"),
    supabase.from("lead_sources").select("id, name").eq("company_id", companyId).order("position").order("name"),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {saved && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Saved.</p>}

      <form action={saveCompany.bind(null, companyId)} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Company details</h2>
        <p className="text-sm text-slate-500">These appear on quotes and invoices.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="name" label="Company name" value={company.name} />
          <Field name="trading_name" label="Trading name" value={company.trading_name} />
          <Field name="company_number" label="Company number" value={company.company_number} />
          <Field name="vat_number" label="VAT number" value={company.vat_number} />
          <Field name="email" label="Email" value={company.email} type="email" />
          <Field name="phone" label="Phone" value={company.phone} />
          <Field name="address_line1" label="Address line 1" value={company.address_line1} />
          <Field name="address_line2" label="Address line 2" value={company.address_line2} />
          <Field name="town" label="Town" value={company.town} />
          <Field name="postcode" label="Postcode" value={company.postcode} />
          <Field name="default_vat_rate" label="Default VAT rate (%)" value={company.default_vat_rate} type="number" />
          <Field name="brand_color" label="Brand colour" value={company.brand_color} type="color" />
        </div>
        <button className="btn-primary">Save details</button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-semibold text-slate-900">Sales pipeline stages</h2>
        <p className="mb-3 text-sm text-slate-500">Used by the sales board. Editing stages comes with the sales phase.</p>
        <div className="grid gap-3 md:grid-cols-3">
          {(["lead", "survey", "order"] as const).map((g) => (
            <div key={g}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{g}</p>
              <ul className="space-y-1 text-sm">
                {(stages ?? []).filter((s) => s.stage_group === g).map((s) => <li key={s.id}>{s.name}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <EditableList title="Job types" items={jobTypes ?? []} companyId={companyId} table="job_types" />
        <EditableList title="Lead sources" items={sources ?? []} companyId={companyId} table="lead_sources" />
      </div>
    </div>
  );
}
