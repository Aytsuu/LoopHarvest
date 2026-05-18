import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f5e6b8_0%,_#f3efe7_45%,_#dce8d4_100%)] px-6 py-10 text-stone-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="grid gap-8 rounded-[2rem] border border-stone-900/10 bg-[#fff9ef]/90 p-8 shadow-[0_24px_80px_rgba(58,44,19,0.12)] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-stone-600">
              LoopHarvest MVP
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight">
              Supabase database and auth are now first-class citizens in the app shell.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-stone-700">
              The repo now includes a Supabase schema migration, row-level security
              policies, SSR auth helpers for Next.js, and bearer-token validation hooks
              for the FastAPI service.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={user ? "/dashboard" : "/login"}
                className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
              >
                {user ? "Open dashboard" : "Open auth flow"}
              </Link>
              <a
                href="https://supabase.com/dashboard"
                className="rounded-2xl border border-stone-900/15 bg-white px-5 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-100"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Supabase dashboard
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              [
                "Database",
                "Tracked in SQL migrations with users, listings, requests, transactions, notifications, RLS, and matching RPC.",
              ],
              [
                "Frontend auth",
                "Supabase SSR clients, OAuth callback, route guard, and protected dashboard flow are wired into the App Router.",
              ],
              [
                "API auth",
                "FastAPI verifies Supabase bearer tokens and stops trusting user ids sent in POST bodies.",
              ],
            ].map(([title, body]) => (
              <article
                key={title}
                className="rounded-3xl border border-stone-900/10 bg-white/80 p-5 shadow-[0_12px_30px_rgba(60,45,20,0.06)]"
              >
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-700">{body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
