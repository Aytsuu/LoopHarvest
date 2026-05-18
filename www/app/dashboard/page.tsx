import { redirect } from "next/navigation";

import { logout } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-[2rem] border border-stone-900/10 bg-white p-8 shadow-[0_18px_50px_rgba(60,45,20,0.08)]">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-stone-600">
            Authenticated Session
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Welcome back, {user.user_metadata.full_name ?? user.email}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-stone-700">
            Your browser session is being managed by Supabase SSR. Use the access token
            from this session when calling the FastAPI endpoints that require a bearer
            token.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Supabase user id", user.id],
            ["Email", user.email ?? "Unknown"],
            ["Audience", user.aud],
          ].map(([label, value]) => (
            <article
              key={label}
              className="rounded-3xl border border-stone-900/10 bg-white p-5 shadow-[0_10px_30px_rgba(60,45,20,0.06)]"
            >
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                {label}
              </p>
              <p className="mt-3 break-all text-sm leading-6 text-stone-800">{value}</p>
            </article>
          ))}
        </section>

        <form action={logout}>
          <button
            type="submit"
            className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
