# Frontend Code Guidelines

Use this guide to reproduce the structure and separation of concerns used by this frontend in other projects. The current frontend is a Next.js App Router application using TypeScript, React Query, Axios, Zod, React Hook Form, Tailwind CSS v4, and shadcn-style UI primitives.

## Baseline Stack

- Use Next.js App Router with `src/app`.
- Use TypeScript in strict mode.
- Use `@/*` as the path alias for `src/*`.
- Use Tailwind CSS with design tokens in `src/app/globals.css`.
- Use shadcn-style primitives under `src/components/ui`.
- Use React Query for client-side server state.
- Use Axios for HTTP integration.
- Use Zod schemas with React Hook Form for form validation.

## Directory Layout

```txt
src/
  app/          Route tree, route layouts, pages, global providers, global CSS
  components/   Reusable UI primitives, composed UI, and wrappers
  context/      Application-level React context providers and context hooks
  helpers/      Pure formatting and transformation helpers
  hooks/        React hooks for mutations, queries, stateful flows, and side effects
  lib/          Shared low-level utilities and library glue
  schemas/      Zod schemas for forms and payload validation
  services/     API clients and external system integration
  types/        Shared TypeScript interfaces and DTO shapes
```

Keep routing, UI, data access, validation, and data shapes separate. A page can compose all of them, but each concern should live in its own layer.

## App Router

- Keep `src/app` focused on routing, layouts, route groups, and page-level composition.
- Use App Router file conventions: `layout.tsx`, `page.tsx`, `not-found.tsx`, and add `loading.tsx` or `error.tsx` when a route needs them.
- Use route groups such as `(main)` when routes share layout or protection behavior without changing the URL.
- Keep shared provider wiring close to the root layout. This project wires theme, tooltip, React Query, auth, notifications, analytics, and toaster providers in `src/app/layout.tsx`.
- Use `"use client"` only when the file needs hooks, browser APIs, event handlers, React Query, context, or client navigation.
- Move large UI sections or reusable page pieces out of route files into `components`, `hooks`, or a feature folder if the project adds one later.

## Components

Organize components by reuse scope:

- `components/ui`: Low-level reusable primitives such as buttons, cards, dialogs, inputs, forms, popovers, sheets, and tooltips. Keep these mostly dumb and prop-driven.
- `components/compositions`: Larger components assembled from UI primitives, such as headers and navigation.
- `components/wrapper`: Provider wrappers and layout wrappers, such as theme providers.
- `context`: Application context providers live in `src/context`, not inside `components`, when they own app-level state.

Component rules:

- Prefer functional components.
- Use named exports for reusable components.
- Use PascalCase component names.
- Use kebab-case component filenames, for example `search-bar.tsx` and `spot-card.tsx`.
- Use `interface` for explicit props when props are non-trivial.
- Destructure props in the function signature when practical.
- Use `cn()` from `@/lib/utils` for conditional class merging.
- Keep component logic local only when it is presentation-specific. Move reusable stateful logic to `hooks`.

## Services

Services own HTTP and external integration logic.

- Put one service file per domain: `auth.service.ts`, `classroom.service.ts`, `assessment.service.ts`, `question.service.ts`.
- Keep shared HTTP client configuration in `api.service.ts`.
- Export a domain service object, for example `AuthService` or `ClassroomService`.
- Keep services framework-independent. Do not import React hooks or components into services.
- Use strict request and response types from `types` or schema inference.
- Let service methods map clearly to backend endpoints or logical API operations.
- Use `async/await`.
- Handle API errors here when the handling is global or domain-wide, then rethrow so callers can react.

Preferred flow:

```txt
page/component -> hook -> service -> api.service.ts -> backend
```

## Hooks

Hooks own React-specific data access and stateful behavior.

- Name files with `use-` kebab-case, for example `use-auth.ts`.
- Name exported hooks with `use` camelCase, for example `useLogin`.
- Wrap React Query `useQuery` and `useMutation` calls in domain hooks.
- Keep query keys stable and include identity inputs such as IDs or the current user ID.
- Use `enabled` for queries that require route params or authenticated user state.
- Use React Query cache updates and invalidation in mutation `onSuccess` handlers.
- Keep loading, error, and cache behavior in hooks so page components stay focused on rendering and form handling.

## Context

Use context for app-level state that many routes need, not for every local state problem.

- Put context providers in `src/context`.
- Export both the provider and a typed consumer hook, such as `AuthProvider` and `useAuth`.
- Throw a clear error when a context hook is used outside its provider.
- Mount global providers from `src/app/layout.tsx` so the dependency graph is visible.
- Keep domain side effects inside providers only when the state is truly global, such as current authenticated user or notification connection state.

## Schemas, Types, And Forms

Use Zod schemas for form validation and payload shape validation.

- Put schemas in `src/schemas`.
- Name schema files by domain with `.schema.ts`, for example `auth.schema.ts`.
- Export descriptive schemas such as `loginSchema`, `signupSchema`, and `resetPassSchema`.
- Use `z.infer<typeof schema>` for form values and service payload types when the schema is the source of truth.
- Put shared DTOs and interfaces in `src/types`.
- Keep interfaces aligned with backend responses.
- Avoid `any`; use `unknown` for caught errors unless a library-specific guard narrows the type.

Form pattern:

```txt
schema -> zodResolver(schema) -> react-hook-form -> service payload
```

## Helpers And Lib

Use `helpers` and `lib` for different kinds of utility code.

- `src/helpers`: Pure application helpers such as date formatting, URL formatting, and error display.
- `src/lib`: Low-level shared utilities and library glue, such as `cn()` for Tailwind class merging.

Do not put business workflows, React hooks, or component-specific code in either folder. If a helper is only used by one component and is not reusable, keep it near that component.

## Styling And Design System

- Centralize design tokens in `src/app/globals.css`.
- Use CSS variables for colors, radius, shadows, chart colors, sidebar colors, and theme modes.
- Prefer token-backed Tailwind classes such as `bg-background`, `text-foreground`, `border-border`, `bg-custom-primary`, and `bg-custom-primary-contrast`.
- Keep reusable visual variants in UI primitives using `class-variance-authority` when appropriate.
- Use `cn()` to merge conditional classes.
- Keep page-level layout classes in pages or compositions, not in services or hooks.
- Preserve light/dark token support when adding new colors.

## Imports

- Prefer `@/` absolute imports for cross-folder imports.
- Relative imports are acceptable inside the same folder or tightly coupled nearby files.
- Avoid deep imports that bypass public component boundaries when a cleaner alias exists.
- Keep type imports explicit with `import type` when importing only types.

## Naming Conventions

- Routes: follow Next.js conventions and use lowercase URL segments.
- Dynamic routes: use bracketed params, for example `[classId]` and `[assessmentId]`.
- Services: kebab-case plus `.service.ts`.
- Hooks: kebab-case with `use-` prefix.
- Schemas: kebab-case plus `.schema.ts`.
- Types: domain-based `.d.ts` or `.ts` files.
- Helpers: descriptive camelCase filenames, matching the current helper style.
- Components: kebab-case filenames with PascalCase exported component symbols.

## Adding A New Domain

When adding a domain such as `courses`, replicate the vertical slice across the existing layers:

```txt
src/types/course.d.ts
src/schemas/course.schema.ts
src/services/course.service.ts
src/hooks/use-course.ts
src/app/(main)/courses/page.tsx
src/app/(main)/courses/[courseId]/page.tsx
```

Use this dependency direction:

```txt
types/schemas -> services -> hooks/context -> app/components
```

Avoid reverse dependencies. Services should not depend on hooks, components, or routes.

## Verification

Before considering a frontend change complete:

- Run `npm run lint`.
- Run `npm run build` for structural, type, and Next.js integration verification.
- For UI changes, manually inspect the affected route in the browser and compare layout, loading, empty, error, and mobile states.
- For data-flow changes, verify query keys, cache invalidation, unauthorized handling, and backend response shapes.

## Do Not Copy These Mistakes

- Do not create a new `QueryClient` directly inside a provider render without stabilizing it; use a stable client instance for production apps.
- Do not use `any` in catch blocks when `unknown` plus type guards is enough.
- Do not let page files grow into business-logic containers. Extract reusable data behavior into hooks and API behavior into services.
- Do not put React-specific code in services.
- Do not duplicate global providers in route groups unless the route intentionally needs a separate provider scope.
