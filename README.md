# LoopHarvest

> Next-generation hyper-local food surplus harvesting and community mutual-aid platform.

---

![LoopHarvest Application Mockup](www/public/mockup.png)

## Overview

**LoopHarvest** is a modern, high-fidelity web and mobile-responsive application built to combat food waste and foster community resilience. It connects local businesses, growers, and individuals with surplus food to neighbors, non-profits, and mutual-aid groups who can utilize it. By transforming organic waste streams into community resources, LoopHarvest makes hyper-local food sharing seamless, secure, and visually interactive.

---

## Key Features

- **🌐 Interactive 3D Globe & Flat Map Navigation**: Discover available food resources in real-time. Built with Mapbox GL, featuring dynamic clusters, live resizing, and responsive projection changes.
- **🔄 Dual-Feed Marketplace**: Post available food surpluses (**Food Waste Listings**) or request support for urgent supplies (**Appeals**) with seamless step-by-step submission flows.
- **📊 Interactive Impact Dashboard**: Real-time tracking of community impact indicators, metrics, and matches mapped directly to UN Sustainable Development Goals (SDG).
- **🎨 Custom Design System & Personalization**:
  - **Selected Color Themes**: Organic HSL Forest Green and minimalist Classic Charcoal-Dark modes.
  - **Dynamic Density Scaling**: Fluid font-scaling to scale text, padding, and gaps proportionately (Spacious, Comfortable, Compact).
  - **Accessibility Controls**: Native High-Contrast mode for enhanced visibility and Reduced Motion mode to toggle heavy translations/animations.
  - **Smooth Animations**: Tailored GPU-composited Magic UI keyframe motion structures.
- **💬 Real-Time Client Synchronizations**: Immediate, server-side and client-side updates driven by Supabase.

---

## Tech Stack

### Frontend (`www/`)
- **Framework**: Next.js 16 (App Router) & React 19 (Client/Server Components)
- **Styling**: Tailwind CSS v4 (Natively compiled theme variables & utilities)
- **Visuals**: Lucide React Icons, Mapbox GL (`react-map-gl`), and Recharts
- **Components**: Customized, high-contrast Material-UI (MUI) components

### Backend & Database (`api/`, `supabase/`)
- **Database & Auth**: Supabase PostgreSQL, row-level security (RLS), and JWT auth
- **Backend Service**: FastAPI (Python 3.11) with Uvicorn for asynchronous endpoints
- **Database Migrations**: Locally orchestrated Supabase CLI migrations

---

## Getting Started

Follow these steps to run LoopHarvest locally.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (required for local Supabase)
- [Node.js v20+](https://nodejs.org/) & [npm v10+](https://www.npmjs.com/)
- [Python 3.11+](https://www.python.org/) & `pip` / `virtualenv`

---

### Step 1: Spin up Local Supabase

LoopHarvest uses the Supabase CLI to manage database structures and authentication locally.

1. Ensure Docker Desktop is running.
2. In the repository root, start the local Supabase containers:
   ```bash
   npx supabase start
   ```
3. Retrieve your local configuration credentials by running:
   ```bash
   npx supabase status
   ```

*Local URLs:*
- **Studio (Database GUI):** `http://127.0.0.1:54323`
- **PostgreSQL Connection URI:** `postgresql://postgres:postgres@127.0.0.1:54332/postgres`

---

### Step 2: Set up the Python API Service (`api/`)

The Python FastAPI backend manages complex workflows, optimization tasks, and analytics schedules.

1. Navigate to the `api` directory:
   ```bash
   cd api
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # On Windows (PowerShell):
   .venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source .venv/bin/activate
   ```
3. Install the backend dependencies:
   ```bash
   pip install -r pyproject.toml
   # Or using poetry/pip:
   pip install -e .
   ```
4. Configure environment variables in `.env` (use `.env.example` as a template).
5. Spin up the development server:
   ```bash
   uvicorn src.main:app --reload
   ```

---

### Step 3: Run the Next.js Frontend (`www/`)

1. Navigate to the `www` directory:
   ```bash
   cd www
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Configure the local environment file `.env.local` with the local Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_supabase_status
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000`.

---

## UN Sustainable Development Goal (SDG) Integrations

We believe that local actions lead to global impact. Our analytics are tied directly to the UN Sustainable Development Goals:

| SDG Goal | Role in LoopHarvest | Local Realization |
| :--- | :--- | :--- |
| **Goal 2: Zero Hunger** | Reallocating organic surplus streams | Tracking pounds of fresh food saved and meals served to vulnerable communities. |
| **Goal 11: Sustainable Cities** | Decentralized, neighborhood-driven sharing networks | Building highly-localized networks, reducing urban trash loads and emissions. |
| **Goal 12: Responsible Consumption** | Combating food loss across distribution chains | Equipping businesses and growers with analytics to optimize yields and inventory. |
| **Goal 13: Climate Action** | Stripping organic waste from landfills to cut methane | Calculating greenhouse gas (CO₂ and methane equivalents) offsets in real time. |

---

## Project Structure

```text
├── .agents/                 # ECC/Codex runtime loaded capabilities
├── api/                     # Python FastAPI server
│   ├── src/                 # Application routers, controllers, and services
│   └── tests/               # Backend Pytest suites
├── contexts/                # Core AI configuration policies and standards
├── supabase/                # Supabase configurations, schemas, and seeds
└── www/                     # Next.js web client
    ├── app/                 # Page components and Next.js routes
    ├── components/          # Reusable React UI blocks (cards, maps, navigation)
    ├── lib/                 # State stores, database clients, themes, and types
    └── public/              # Visual assets, branding icons, and mockups
```

