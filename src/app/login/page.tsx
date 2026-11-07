import Link from "next/link";
import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string; message?: string; next?: string }>;
}) {
  const { mode, error, message, next = "/" } = await searchParams;
  const isSignup = mode === "signup";

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-orange-500 text-xl font-bold text-white">B</div>
          <h1 className="text-2xl font-semibold text-slate-900">Buildster Portal</h1>
          <p className="text-sm text-slate-500">{isSignup ? "Create your account" : "Sign in to your account"}</p>
        </div>

        <form action={isSignup ? signUp : signIn} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <input type="hidden" name="next" value={next} />
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {message && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
          {isSignup && (
            <label className="block">
              <span className="label">Your name</span>
              <input name="full_name" required className="input" autoComplete="name" />
            </label>
          )}
          <label className="block">
            <span className="label">Email</span>
            <input name="email" type="email" required className="input" autoComplete="email" />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input name="password" type="password" required minLength={8} className="input" autoComplete={isSignup ? "new-password" : "current-password"} />
          </label>
          <button className="btn-primary w-full">{isSignup ? "Create account" : "Sign in"}</button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          {isSignup ? (
            <>Already have an account? <Link className="link" href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link></>
          ) : (
            <>New here? <Link className="link" href={`/login?mode=signup&next=${encodeURIComponent(next)}`}>Create an account</Link></>
          )}
        </p>
      </div>
    </main>
  );
}
