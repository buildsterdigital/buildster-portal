import { redirect } from "next/navigation";
import { requireUser } from "@/lib/company";

async function createCompany(formData: FormData) {
  "use server";
  const { supabase } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/companies/new?error=Please+enter+a+company+name");
  const { data, error } = await supabase.rpc("create_company", { company_name: name });
  if (error) redirect(`/companies/new?error=${encodeURIComponent(error.message)}`);
  redirect(`/c/${data}/dashboard`);
}

export default async function NewCompanyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">Set up a company</h1>
      <p className="mb-6 text-sm text-slate-500">
        Each trade business gets its own space with its own customers, jobs, users and settings. You can add more later.
      </p>
      <form action={createCompany} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <label className="block">
          <span className="label">Company name</span>
          <input name="name" required className="input" placeholder="e.g. Collins Heating and Cooling Ltd" />
        </label>
        <button className="btn-primary w-full">Create company</button>
      </form>
    </main>
  );
}
