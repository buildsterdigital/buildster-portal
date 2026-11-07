"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCompanyContext } from "@/lib/company";
import { canManageCompany, ROLES, type Role } from "@/lib/roles";

function parseRole(value: FormDataEntryValue | null): Role {
  const r = String(value ?? "");
  return (ROLES as readonly string[]).includes(r) ? (r as Role) : "office";
}

export async function inviteUser(companyId: string, formData: FormData) {
  const { supabase, user, role } = await getCompanyContext(companyId);
  if (!canManageCompany(role)) redirect(`/c/${companyId}/users?error=Only+admins+can+invite+users`);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const newRole = parseRole(formData.get("role"));
  if (newRole === "owner" && role !== "owner") redirect(`/c/${companyId}/users?error=Only+an+owner+can+add+another+owner`);
  const { error } = await supabase.from("invites").insert({ company_id: companyId, email, role: newRole, invited_by: user.id });
  if (error) redirect(`/c/${companyId}/users?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/c/${companyId}/users`);
}

export async function cancelInvite(companyId: string, inviteId: string) {
  const { supabase } = await getCompanyContext(companyId);
  await supabase.from("invites").delete().eq("id", inviteId).eq("company_id", companyId);
  revalidatePath(`/c/${companyId}/users`);
}

export async function changeRole(companyId: string, userId: string, formData: FormData) {
  const { supabase, role } = await getCompanyContext(companyId);
  const newRole = parseRole(formData.get("role"));
  if (newRole === "owner" && role !== "owner") redirect(`/c/${companyId}/users?error=Only+an+owner+can+make+someone+an+owner`);
  const { error } = await supabase.from("memberships").update({ role: newRole }).eq("company_id", companyId).eq("user_id", userId);
  if (error) redirect(`/c/${companyId}/users?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/c/${companyId}/users`);
}

export async function removeUser(companyId: string, userId: string) {
  const { supabase } = await getCompanyContext(companyId);
  await supabase.from("memberships").delete().eq("company_id", companyId).eq("user_id", userId);
  revalidatePath(`/c/${companyId}/users`);
}
