# Lenox Okoth — Full-Stack Developer Portfolio & Resume Platform

A premium, self-hosted portfolio, resume system, and admin dashboard for
**Lenox Okoth** (Full-Stack Software Engineer · founder of Lentech).

- **Frontend**: React 18 + TypeScript + Vite, plain CSS with design tokens (no CSS framework), `react-router-dom`.
- **Backend**: Django 6 + Django REST Framework, token auth, reportlab PDF generation, SQLite (dev) / PostgreSQL (prod), whitenoise + gunicorn.
- **AI resume assistant**: deterministic local matching engine (always available) with an optional, grounded LLM pass when `AI_API_KEY` is set.

---

## Pages

| Route | Description |
| --- | --- |
| `/` | Home — hero, about, skills by category, featured projects, experience, education, certifications, contact form |
| `/projects` | All projects with category filter |
| `/projects/<slug>` | Case-study detail — problem → solution → architecture → challenges/results/lessons |
| `/resume` | Online resume: versioned previews, ATS PDF download, print layout, **Match my resume** tool |
| `/admin/*` | Owner dashboard — full content management + resume builder (token auth, staff only) |
| `*` | 404 page |

---

## Public API (no auth)

| Endpoint | Purpose |
| --- | --- |
| `GET /api/content/` | Single payload powering the homepage |
| `GET /api/resume/preview/<slug>/` | Structured resume for the online preview |
| `GET /api/resume/pdf/<slug>/` | ATS-friendly PDF (reportlab) |
| `POST /api/contact/` | Contact messages — validated, sanitized, honeypot, rate limited (5/hour) |
| `POST /api/ai/analyze/` | **Match my resume** — job-description fit analysis (guest-safe, throttled) |
| `POST /api/events/` | Anonymous analytics (resume download, project views, etc.) |

## Owner API (token auth)

- `/api/auth/…` — login, logout, me, change-password
- `/api/profile/`, `/api/skills/`, `/api/experience/`, `/api/education/`, `/api/certifications/`, `/api/links/`
- `/api/projects/` (nested technologies, features, case study)
- `/api/technologies/`
- `/api/resume/`, `/api/resume/versions/`, `/api/resume/sections/`
- `/api/contact/messages/` (read-only fields; status transitions only)
- `/api/ai/assist/` (staff-only rewriting, grounded in resume content)
- `/api/ai/history/` (recent analyses)

Security notes: write endpoints require `is_staff`; public reads only see
`active`/`published` records; `assist` requires a staff user.

---

## Run locally

### Backend

```powershell
cd cv
py -m venv .venv            # done already in this repo
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements-dev.txt

cd backend
Copy-Item .env.example .env   # adjust as needed
python manage.py migrate
python manage.py seed_demo   # profile, skills, experience, projects, 3 resume versions, staff user
python manage.py runserver   # http://127.0.0.1:8000
```

The seed command creates a staff user:

```
username: lenox
password: Admin#ChangeMe2026
```

> **Change this password immediately.** Contact details (email, WhatsApp,
> phone, LinkedIn, Facebook, Instagram, TikTok, YouTube) are already seeded from
> the owner's real accounts and can be edited in **Profile** and **Social links**.

### Frontend

```powershell
cd cv\frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api -> :8000)
```

### Tests & checks

```powershell
# backend
cd cv\backend
python -m pytest -q

# frontend
cd cv\frontend
npm run build               # tsc -b && vite build
```

---

## Production build

Build the React app and serve it with Django + whitenoise (already configured):

```powershell
cd cv\frontend
npm run build               # outputs dist/
```

```powershell
cd cv\backend
Copy-Item .env.production.example .env   # fill real values (PostgreSQL, hosts, secrets)
python manage.py collectstatic --noinput
python manage.py migrate
gunicorn config.wsgi:application
```

CORS headless: the frontend is served from the same host in production, so API
calls hit `/api/...` directly and no separate CORS config is needed.

---

## Content rules (verified-only)

- Every fact in the seed is real and verified; nothing is invented.
- Certifications are intentionally empty until the owner has credentials.
- Skills are grouped by category with **no** proficiency percentages (honest by design).
- Projects include status (`implemented` / `in_progress` / `planned`) so nothing is overstated.

## Structure

```
cv/
├─ backend/
│  ├─ config/            # settings, URLs, API error envelope
│  ├─ accounts/          # token auth
│  ├─ portfolio/         # profile, skills, experience, education, certs, links, analytics
│  ├─ projects/          # projects, case studies, features, technologies
│  ├─ resume/            # resume + versions + sections, PDF renderer
│  ├─ contact/           # public contact form + owner inbox
│  ├─ ai_assistant/      # matching engine + optional grounded LLM
│  └─ tests/             # 32 pytest tests
└─ frontend/
   ├─ src/pages/         # public + admin pages
   ├─ src/admin/         # login, dashboard layout, CRUD sections, resume builder
   ├─ src/components/    # hero, sections, cards, resume preview, match tool…
   ├─ src/hooks/         # content, auth, toast, resume, theme/reveal
   ├─ src/services/      # typed API clients (content, auth, contact, ai, analytics)
   └─ src/styles/        # tokens, base, components, layout, pages, admin, print
```