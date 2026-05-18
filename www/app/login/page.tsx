import Link from "next/link";

import { loginWithGoogle, loginWithPassword, signUpWithPassword } from "@/app/login/actions";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const next = params.next ?? "/dashboard";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f6c96d,_#f2efe7_42%,_#d8e0d1)] px-6 py-12 text-stone-900">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="flex flex-col justify-between rounded-[2rem] border border-stone-900/10 bg-[#fffaf1]/90 p-8 shadow-[0_20px_60px_rgba(60,45,20,0.12)] backdrop-blur">
          <div className="space-y-6">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-stone-600">
              LoopHarvest
            </p>
            <h1 className="max-w-xl font-serif text-5xl leading-[1.05] tracking-tight text-stone-900">
              Turn food waste into a verified local resource stream.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-stone-700">
              Supabase auth is wired for email/password and Google sign-in. The database
              schema, profile sync trigger, and row-level security policies live in the
              repo so local and hosted environments can stay aligned.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              "Verified donor and recipient accounts",
              "Server-side session handling for App Router",
              "RLS-backed tables for listings, requests, and notifications",
            ].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-stone-900/10 bg-white/80 p-4 text-sm leading-6 text-stone-700"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-900/10 bg-white/85 p-8 shadow-[0_20px_60px_rgba(60,45,20,0.1)] backdrop-blur">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm leading-6 text-stone-600">
              Use email/password for local testing or Google OAuth once it is enabled in
              your Supabase project.
            </p>
          </div>

          {params.error ? (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {params.error}
            </p>
          ) : null}

          {params.message ? (
            <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {params.message}
            </p>
          ) : null}

          <form action={loginWithPassword} className="mt-8 space-y-4">
            <input type="hidden" name="next" value={next} />
            <label className="block space-y-2 text-sm font-medium text-stone-700">
              <span>Email</span>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-stone-500"
                placeholder="grower@loopharvest.app"
              />
            </label>
            <label className="block space-y-2 text-sm font-medium text-stone-700">
              <span>Password</span>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-stone-500"
                placeholder="Minimum 8 characters"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
            >
              Sign in with email
            </button>
            <button
              type="submit"
              formAction={signUpWithPassword}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-100"
            >
              Create account with email
            </button>
          </form>

          <form action={loginWithGoogle} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-2xl border border-stone-900/10 bg-[#f3efe5] px-4 py-3 text-sm font-semibold text-stone-900 transition hover:bg-[#ece4d3]"
            >
              Continue with Google
            </button>
          </form>

          <p className="mt-6 text-sm leading-6 text-stone-600">
            Callback route: <code>/auth/callback</code>. Protected area:{" "}
            <Link className="font-medium text-stone-900 underline" href="/dashboard">
              /dashboard
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
