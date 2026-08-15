# Deploying Nills Mart to Namecheap (cPanel shared hosting)

Target: `nillsmart.com`, registered in the Namecheap account, expiring 10 Oct 2026.

## Architecture

Two separately-hosted halves on the same cPanel account:

| Host | Serves | How |
| :-- | :-- | :-- |
| `nillsmart.com` → `public_html/` | Static React SPA | Plain Apache/LiteSpeed file serving + `.htaccess` |
| `api.nillsmart.com` → `~/nillsmart-api/` | FastAPI | cPanel "Setup Python App" (Phusion Passenger) |

The API deliberately gets its **own subdomain** rather than a `/api` path on the
main domain. Mounting a Passenger app under a path prefix means the app receives
a `SCRIPT_NAME` it has to strip, which is a class of bug that costs an afternoon
to diagnose; a subdomain gives FastAPI a clean `/` root and costs nothing.

The database is **SQLite**, not PostgreSQL. Namecheap shared hosting provides
MySQL/MariaDB only. See [Limitations](#limitations-you-are-accepting) before
committing to this.

---

## Before you start: three things I could not verify from here

1. **Is the hosting plan actually active?** The account dashboard showed a
   hosting product icon next to the domain, but not the plan type. Open cPanel
   and confirm you can reach it.
2. **Does your plan have "Setup Python App"?** In cPanel, look under
   **Software**. If it is absent, the plan does not support Python and the
   backend cannot run here — skip to [If Python apps are unavailable](#if-python-apps-are-unavailable).
3. **Which Python versions does it offer?** The code needs **3.11+** (it uses
   modern typing and SQLAlchemy 2.0 async). If the newest on offer is 3.9 or
   3.10, test locally on that version before deploying.

---

## Step 1 — Point the domain at the hosting

In the Namecheap dashboard, **Domain List → nillsmart.com → Manage → Nameservers**.

- If the plan is Namecheap's own hosting, choose **Namecheap BasicDNS** or the
  hosting nameservers shown in your hosting welcome email.
- DNS propagation is minutes to a few hours. Nothing below works until
  `nillsmart.com` resolves to your hosting IP. Check with `nslookup nillsmart.com`.

## Step 2 — Create the API subdomain

cPanel → **Domains → Create A New Domain**:

- Domain: `api.nillsmart.com`
- Uncheck "Share document root"
- Document root: leave the default (`/home/USER/api.nillsmart.com`)

If your DNS is managed at Namecheap rather than by the hosting nameservers, also
add an **A record** for host `api` pointing at the hosting IP.

## Step 3 — Upload the backend

Upload the `backend/` directory to `/home/USER/nillsmart-api/` — **not** inside
`public_html`. Anything under `public_html` is downloadable over HTTP, and that
directory will contain your `.env` and your SQLite database.

Exclude from the upload: `venv/`, `__pycache__/`, `*.db`, `tests/`.

Via SSH (if your plan includes it — faster and less error-prone than File Manager):

```bash
# from your machine
cd "d:/Intern Projects/E-commerce"
tar --exclude=venv --exclude=__pycache__ --exclude='*.db' --exclude=tests \
    -czf backend.tar.gz backend/
scp backend.tar.gz USER@nillsmart.com:~/
ssh USER@nillsmart.com 'tar -xzf backend.tar.gz && mv backend nillsmart-api && rm backend.tar.gz'
```

## Step 4 — Create the Python App

cPanel → **Setup Python App → Create Application**:

| Field | Value |
| :-- | :-- |
| Python version | 3.11 (or the highest offered) |
| Application root | `nillsmart-api` |
| Application URL | `api.nillsmart.com` |
| Application startup file | `passenger_wsgi.py` |
| Application Entry point | `application` |

The startup file and entry point must match exactly — [backend/passenger_wsgi.py](backend/passenger_wsgi.py)
exposes a module-level `application`.

Then add the environment variables. Copy them from
[backend/.env.cpanel.example](backend/.env.cpanel.example), replacing every
`USER` with your cPanel username and generating a real `SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

You can either paste each variable into the Python App UI's "Environment
variables" section, or upload the file as `~/nillsmart-api/.env`. Do not do both
with different values.

## Step 5 — Install dependencies and create the schema

The Python App page shows a "command to enter to the virtual environment" —
copy it. Over SSH:

```bash
source /home/USER/virtualenv/nillsmart-api/3.11/bin/activate && cd ~/nillsmart-api

pip install -r requirements-cpanel.txt

# Create the tables and load the catalogue. This is not optional: the ASGI
# lifespan hook that normally calls create_all does NOT run under Passenger's
# WSGI bridge, so without this the database has no tables.
python scripts/seed_catalog.py
python scripts/create_admin_auto.py
```

Then hit **Restart** on the Python App page.

> Use `requirements-cpanel.txt`, not `requirements.txt` — the latter pulls in
> `asyncpg`, which has no PostgreSQL to talk to here and is a frequent cause of
> failed installs on shared hosts.

Verify the backend before touching the frontend:

```bash
curl https://api.nillsmart.com/
# -> {"message":"Welcome to E-Commerce FastAPI Backend API",...}

curl https://api.nillsmart.com/api/v1/products
```

If you get a 500, the Passenger error log is at `~/nillsmart-api/stderr.log` or
in cPanel → **Errors**.

## Step 6 — Build and upload the frontend

On your machine:

```bash
cd "d:/Intern Projects/E-commerce"
npm run build:cpanel
```

This is the SPA build: it emits a static `dist/client/index.html` plus hashed
assets, with `https://api.nillsmart.com/api/v1` compiled in from
[.env.cpanel](.env.cpanel). (The default `npm run build` produces an SSR bundle
that needs a Node server — Namecheap shared hosting cannot run it.)

Upload **the contents of `dist/client/`** into `public_html/` — the files
themselves, not the folder. Include the hidden `.htaccess`; in cPanel File
Manager you must turn on **Settings → Show Hidden Files** to see it.

`.htaccess` is generated into the build from [public/.htaccess](public/.htaccess),
so it stays in sync automatically. It handles the SPA deep-link fallback, the
HTTPS redirect, the www→apex canonicalisation, and asset caching.

## Step 7 — SSL

cPanel → **SSL/TLS Status** → select `nillsmart.com`, `www.nillsmart.com` and
`api.nillsmart.com` → **Run AutoSSL**.

Do this promptly: the `.htaccess` forces HTTPS, so until certificates are issued
visitors get a browser warning. Both the apex and the API subdomain need one —
a browser will refuse the API calls otherwise.

## Step 8 — Post-deploy checklist

- [ ] `https://nillsmart.com` loads the storefront
- [ ] `https://nillsmart.com/checkout` loads on a **hard refresh** (proves the SPA rewrite works)
- [ ] `https://www.nillsmart.com` redirects to the apex
- [ ] Products render — if the grid is empty, the browser console will show a CORS or 404 error against the API
- [ ] Place a test order end to end
- [ ] `https://api.nillsmart.com/api/v1/products` returns JSON
- [ ] **Log into `/admin` and change the default password immediately.** The
      credentials `admin@nillsmart.com` / `admin12345` are published in
      [README.md](README.md), which means they are public.
- [ ] Enable Two-Factor Authentication on the Namecheap account itself — the
      dashboard currently shows it **OFF**, and that account controls the domain.

---

## Limitations you are accepting

**SQLite under Passenger.** Passenger runs multiple worker processes against one
database file. Reads are fine; concurrent writes serialise and a burst can
surface as `database is locked`. This is acceptable at launch scale and will not
be at scale. The upgrade path is MySQL: create the database in cPanel, add
`asyncmy` to `requirements-cpanel.txt`, and change `DATABASE_URL` to
`mysql+asyncmy://...`. Test it — the models use a UUID column type
([backend/app/db/types.py](backend/app/db/types.py)) whose MySQL behaviour has
not been exercised.

**Back up the database.** It is a single file at
`~/nillsmart-api/ecommerce.db` and it holds every order you take. A cPanel cron
job copying it somewhere dated, daily, is fifteen minutes of work and the
alternative is losing the store's records.

**No lifespan hook.** Schema changes do not apply themselves on restart. After
changing a model, re-run a script that calls `create_all` (and note that
`create_all` only ever *adds* tables — it will not alter an existing one, so a
changed column needs Alembic or a manual migration).

**Cold starts.** Passenger idles the app out after a period of no traffic; the
next request pays a few seconds to boot it.

**Outbound SMTP is often blocked** on shared hosting. If password-reset mail
silently fails, that is the first thing to suspect — switch `MAIL_SERVER` to
Namecheap Private Email or the local cPanel mail server.

**Deploys are manual.** There is no git-push-to-deploy here. Every frontend
change is a rebuild and a re-upload; every backend change is a re-upload and a
Restart.

## If Python apps are unavailable

If cPanel has no "Setup Python App", the backend cannot run on this plan. The
frontend still deploys to `public_html` exactly as described in Step 6; host the
API elsewhere and point `VITE_API_BASE_URL` in `.env.cpanel` at it. Render,
Railway and Fly.io all run this FastAPI app from the existing
[backend/Dockerfile](backend/Dockerfile) with managed PostgreSQL, which would
also let you drop the SQLite compromise and keep the `asyncpg` code path the
project was actually written against.
