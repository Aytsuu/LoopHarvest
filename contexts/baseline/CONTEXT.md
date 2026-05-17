## Product Context

**Target User:** Teachers managing one or more classrooms.

**Core Value Proposition:**  
Eliminate the manual burden of checking student exam papers. The teacher uploads a test paper (with answers), the AI extracts and validates the data, then processes each student's scanned paper — producing grades and actionable feedback automatically.

---

## Full Application Workflow

### 1. Authentication
- User logs in to their personal account.
- Session management.

### 2. Dashboard (Initial Screen)
- Displays **meaningful metrics and analytics** per classroom and per student:
  - Average scores, pass/fail rates, top/bottom performers.
  - Trend charts (e.g., improvement over multiple tests).
  - Quick-access cards for recent activity.

### 3. Navigation (Sidebar)
- Links to: Dashboard, Classrooms, Reports, Settings.
- Active state indicators and collapsible sections if needed.

### 4. Classrooms
- Teacher can **create and manage classrooms**.
- Entry point to the **exam checking workflow**.

---

## Exam Checking Workflow (Core Feature)

### Step 1 — Configure Exam Session
- Teacher sets **grade point values** per question or section.
- Configures exam metadata (subject, date, total points).

### Step 2 — Upload Answer Key (PDF)
- Teacher uploads the **original test paper with answers** as a PDF.
- AI pipeline:
  1. Parses and extracts all questions and correct answers.
  2. Displays extracted data in a **structured confirmation UI**.
  3. Teacher **reviews and confirms** the extraction before proceeding (double-validation gate).
  4. Teacher can **manually correct** any misread or missing items before confirming.

### Step 3 — Scan Student Papers
- Teacher scans each student's paper (one at a time or batch).
- AI evaluates scan quality:
  - If a scan is **unclear or low-quality**, the system prompts a **rescan request** with a specific reason (e.g., "Page too dark", "Answer area cropped").
- AI processes each accepted scan against the confirmed answer key.

### Step 4 — Results & Feedback
- For each student, display:
  - Score and grade breakdown by question/section.
  - **Performance feedback summary**: strengths, weak areas, suggestions for improvement.
  - A dedicated **"Missed/Uncertain Items" section** — explicitly flags any parts the AI could not confidently process (to prevent silent hallucinations or omissions).

### Step 5 — Intervention & Sharing
- Teacher can **flag underperforming students** for follow-up.
- Feedback report is **downloadable** (PDF or printable format).
- Optionally **shareable** directly with students so they know what to improve.

---

## Technical Requirements

### Backend (`/backend`)
- Modular service architecture (e.g., `auth`, `classrooms`, `exams`, `ai-pipeline`, `reports`).
- PDF ingestion and AI extraction service with a **validation layer** before committing extracted data.
- Scan processing endpoint that returns:
  - Confidence scores per extracted answer.
  - A list of flagged/uncertain items.
- All AI calls should be **logged** for audit and debugging.

### Frontend (`/frontend`)
- Component-driven structure (e.g., React or equivalent).
- Confirmation UI must clearly diff what was extracted vs. the original — make discrepancies visually obvious.
- Scan flow must have a **clear step indicator** so teachers always know where they are in the process.
- Missed items panel must be **visually distinct** (e.g., warning banner, separate card section) — never buried.

### Documentation (`/docs`)
Create one `.md` file per major concern:
- `architecture.md` — High-level system and data flow diagram.
- `ai-pipeline.md` — How the PDF extraction and scan processing works.
- `exam-workflow.md` — Step-by-step exam session flow with edge cases.
- `api-reference.md` — All backend endpoints with request/response shapes.
- `components.md` — Key frontend components and their props/responsibilities.

---

## Constraints & Quality Standards
- **No silent failures** — every AI inference must surface uncertainty explicitly.
- **Double-validation is non-negotiable** — the teacher must confirm extracted data before any student paper is checked against it.
- **Rescan logic must be deterministic** — define clear, testable thresholds for what constitutes an unacceptable scan.
- All functions and API handlers must have **meaningful comments** explaining *why*, not just *what*.
- Follow existing naming conventions found in `/backend` and `/frontend` unless a convention is clearly inconsistent, in which case normalize it and document the change in `/docs/architecture.md`.