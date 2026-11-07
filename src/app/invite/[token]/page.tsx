import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS, type Role } from "@/lib/roles";

async function accept(token: string) {
  "use server";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invite", { invite_token: token });
  if (error) redirect(`/invite/${token}?error=${encodeURIComponent(error.message)}`);
  redirect(`/c/${data}/dashboard`);
}

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.rpc("invite_details", { invite_token: token });
  const invite = (data as { company_name: string; email: string; role: Role }[] | null)?.[0];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const next = encodeURIComponent(`/invite/${token}`);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center">
        {!invite ? (
          <p className="text-slate-700">This invite has expired or has already been used.</p>
        ) : (
          <>
            <h1 className="mb-2 text-xl font-semibold text-slate-900">Join {invite.company_name}</h1>
            <p className="mb-6 text-sm text-slate-500">
              You&apos;ve been invited as <strong>{ROLE_LABELS[invite.role]}</strong> ({invite.email}).
            </p>
            {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {user ? (
              <form action={accept.bind(null, token)}>
                <button className="btn-primary w-full">Accept invite</button>
              </form>
            ) : (
              <div className="space-y-2">
                <Link className="btn-primary block" href={`/login?mode=signup&next=${next}`}>Create an account</Link>
                <Link className="btn-secondary block" href={`/login?next=${next}`}>I already have an account</Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
