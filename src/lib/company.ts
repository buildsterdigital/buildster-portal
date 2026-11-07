import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/roles";

export type Company = {
  id: string;
  name: string;
  trading_name: string | null;
  company_number: string | null;
  vat_number: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  town: string | null;
  postcode: string | null;
  brand_color: string;
  default_vat_rate: number;
};

export type MyCompany = { id: string; name: string; role: Role };

// The signed-in user, or a redirect to /login.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

// Every company the user belongs to, for the switcher.
export async function getMyCompanies(): Promise<MyCompany[]> {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("memberships")
    .select("role, companies(id, name)")
    .eq("user_id", user.id)
    .order("created_at");
  return (data ?? []).flatMap((m) => {
    const c = m.companies as unknown as { id: string; name: string } | null;
    return c ? [{ id: c.id, name: c.name, role: m.role as Role }] : [];
  });
}

// The company in the URL plus the user's role in it. 404 if they are not a member.
export async function getCompanyContext(companyId: string) {
  const { supabase, user } = await requireUser();
  const { data: company } = await supabase.from("companies").select("*").eq("id", companyId).maybeSingle();
  if (!company) notFound();
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .maybeSingle();
  const { data: admin } = await supabase.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  const role: Role | null = (membership?.role as Role) ?? (admin ? "admin" : null);
  return { supabase, user, company: company as Company, role };
}
