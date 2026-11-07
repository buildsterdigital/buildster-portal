import { headers } from "next/headers";
import { getCompanyContext } from "@/lib/company";
import { canManageCompany, ROLE_DESCRIPTIONS, ROLE_LABELS, ROLES, type Role } from "@/lib/roles";
import { cancelInvite, changeRole, inviteUser, removeUser } from "./actions";

export default async function UsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { companyId } = await params;
  const { error } = await searchParams;
  const { supabase, user, role } = await getCompanyContext(companyId);
  const isAdmin = canManageCompany(role);

  const { data: members } = await supabase
    .from("memberships")
    .select("user_id, role, created_at")
    .eq("company_id", companyId)
    .order("created_at");
  const ids = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, email, full_name").in("id", ids)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const { data: invites } = isAdmin
    ? await supabase.from("invites").select("id, email, role, token, created_at").eq("company_id", companyId).is("accepted_at", null).order("created_at")
    : { data: [] };

  const origin = (await headers()).get("origin") ?? "";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              {isAdmin && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(members ?? []).map((m) => {
              const p = profileById.get(m.user_id);
              const isMe = m.user_id === user.id;
              return (
                <tr key={m.user_id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{p?.full_name || p?.email}{isMe && " (you)"}</p>
                    <p className="text-slate-500">{p?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && !isMe ? (
                      <form action={changeRole.bind(null, companyId, m.user_id)} className="flex gap-2">
                        <select name="role" defaultValue={m.role} className="input py-1">
                          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                        <button className="btn-secondary">Save</button>
                      </form>
                    ) : (
                      <span className="badge">{ROLE_LABELS[m.role as Role]}</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      {!isMe && (
                        <form action={removeUser.bind(null, companyId, m.user_id)}>
                          <button className="text-red-600 hover:underline">Remove</button>
                        </form>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {isAdmin && (
        <section className="grid gap-6 md:grid-cols-2">
          <form action={inviteUser.bind(null, companyId)} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">Invite someone</h2>
            <label className="block">
              <span className="label">Email</span>
              <input name="email" type="email" required className="input" />
            </label>
            <label className="block">
              <span className="label">Role</span>
              <select name="role" defaultValue="office" className="input">
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </label>
            <button className="btn-primary">Create invite</button>
            <p className="text-xs text-slate-500">You&apos;ll get a link to send them. Email sending is added with the integrations phase.</p>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">What each role can do</h2>
            <dl className="space-y-2 text-sm">
              {ROLES.map((r) => (
                <div key={r}>
                  <dt className="font-medium text-slate-800">{ROLE_LABELS[r]}</dt>
                  <dd className="text-slate-500">{ROLE_DESCRIPTIONS[r]}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {isAdmin && (invites ?? []).length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-slate-900">Pending invites</h2>
          <ul className="space-y-3 text-sm">
            {(invites ?? []).map((i) => (
              <li key={i.id} className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <span>
                  {i.email} · {ROLE_LABELS[i.role as Role]}
                </span>
                <span className="flex items-center gap-3">
                  <code className="max-w-xs truncate rounded bg-slate-100 px-2 py-1 text-xs">{`${origin}/invite/${i.token}`}</code>
                  <form action={cancelInvite.bind(null, companyId, i.id)}>
                    <button className="text-red-600 hover:underline">Cancel</button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
