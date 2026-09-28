# MemriPlace

## Run With Docker

The project runs as a self-contained Docker Compose stack:

- `frontend`: Vite dev server at http://localhost:5173
- `backend`: FastAPI available inside Docker as `backend:80`
- `db`: PostgreSQL available inside Docker as `db:5432`

Start everything:

```sh
docker compose up --build
```

Compose has safe local defaults, so a `.env` file is optional. To customize ports,
credentials, or API keys:

```sh
cp .env.example .env
```

Then edit `.env` and restart the stack.

Postgres stores its username and password when its Docker volume is first
created. Keep the `POSTGRES_*` values stable after that point. If you need to
change those values, either retain the existing credentials to preserve local
data or reset the local volume with the command at the end of this guide.

If you want to connect from a host database client, add a local Compose override
that publishes `db` port `5432` to an unused host port.

FastAPI docs are proxied through the frontend at http://localhost:5173/docs.

The frontend uses relative `/api/...` calls by default. In Docker, Vite proxies
those requests to the `backend` container. If you need the browser to call a
specific backend URL directly, set `VITE_API_URL`.

## Deploy To Render

The repo includes a Render Blueprint at `render.yaml`. It creates:

- `memribox-web`: the public Nginx/Vite frontend
- `memribox-api`: the FastAPI backend on Render's 512 MB paid compute plan
- `memribox-db`: a managed Render Postgres database on the 256 MB paid
  compute plan with 1 GB of storage

In Render, create a new Blueprint from this repository. During setup, Render
will prompt for the secret values marked with `sync: false`:

- `FIRST_SUPERUSER_PASSWORD`: the seeded admin password for `admin@example.com`
- `OPENAI_API_KEY`: required for AI conversation features

The frontend is configured as the public app. It serves static files and proxies
`/api`, `/docs`, and `/redoc` to the API service's Render-managed public hostname.
The frontend remains on Render's free web-service plan. The API uses
`0.5c-512mb`, so it stays available instead of sleeping after inactivity. The
database uses `0.1c-256mb` with 1 GB of storage so it does not expire under the
free database limit. The backend runs migrations and seeds initial data from
`backend/prestart.sh` before starting.

The Blueprint is configured for `memriplace.com` and `www.memriplace.com`.
Add the custom domain to the frontend service in Render and complete the DNS
verification before sending users to it.

Optional upload settings can be added to `memribox-api` later if you use S3
uploads: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`AWS_UPLOAD_BUCKET_NAME`, and `AWS_DEFAULT_REGION`.

Run backend tests inside Docker:

```sh
docker compose exec backend bash /app/tests-start.sh
```

Reset local Docker data:

```sh
docker compose down -v --remove-orphans
```
