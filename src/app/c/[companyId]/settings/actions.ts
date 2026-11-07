"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCompanyContext } from "@/lib/company";
import { canManageCompany } from "@/lib/roles";

const FIELDS = [
  "name", "trading_name", "company_number", "vat_number", "email", "phone",
  "address_line1", "address_line2", "town", "postcode", "brand_color",
] as const;

async function adminOnly(companyId: string) {
  const ctx = await getCompanyContext(companyId);
  if (!canManageCompany(ctx.role)) redirect(`/c/${companyId}/dashboard`);
  return ctx;
}

export async function saveCompany(companyId: string, formData: FormData) {
  const { supabase } = await adminOnly(companyId);
  const update: Record<string, string | number | null> = {};
  for (const f of FIELDS) update[f] = String(formData.get(f) ?? "").trim() || null;
  if (!update.name) redirect(`/c/${companyId}/settings?error=Company+name+is+required`);
  update.brand_color = update.brand_color ?? "#f97316";
  update.default_vat_rate = Number(formData.get("default_vat_rate") ?? 20);
  const { error } = await supabase.from("companies").update(update).eq("id", companyId);
  if (error) redirect(`/c/${companyId}/settings?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/c/${companyId}`, "layout");
  redirect(`/c/${companyId}/settings?saved=1`);
}

type ListTable = "job_types" | "lead_sources";

export async function addListItem(companyId: string, table: ListTable, formData: FormData) {
  const { supabase } = await adminOnly(companyId);
  const name = String(formData.get("name") ?? "").trim();
  if (name) await supabase.from(table).insert({ company_id: companyId, name, position: 999 });
  revalidatePath(`/c/${companyId}/settings`);
}

export async function removeListItem(companyId: string, table: ListTable, id: string) {
  const { supabase } = await adminOnly(companyId);
  await supabase.from(table).delete().eq("id", id).eq("company_id", companyId);
  revalidatePath(`/c/${companyId}/settings`);
}
