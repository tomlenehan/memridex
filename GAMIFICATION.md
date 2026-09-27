# Constellation style, version 1

Branch: `codex-gamify-style-1`.

This checkout is `/Users/tomlenehan/Dev/memriplace-gamify`. The original checkout has an unfinished rebase, which has been preserved. No commits or pushes were made for this work.

## Experience

- A bright constellation with selectable saved memories and lines for user-confirmed relationships. A card view remains available.
- One highlighted next action: resume/explore a story, or start a new one. Available story branches remain accessible.
- The star mascot, Framer Motion entrances, tactile buttons, and a short confetti burst after saving.
- Optional Howler celebration chime, off by default. Its header control affects celebration sounds only, never conversation speech. The WAV is an original synthesized C–E–G chime, with no third-party recording.
- Reduced motion disables decorative movement/confetti. All map stars are native keyboard-operable buttons, and the map adapts to two columns on phones.

## Progress rules

`memoryxp` records 25 XP once per conversation saved with at least one user response. It is awarded in the same database transaction as the story. A unique user/conversation constraint prevents duplicate rewards, including simultaneous requests. Deleting a story does not remove earned XP; re-saving the same conversation does not award more.

`memoryday` records one entry per user and UTC date with a newly rewarded story. The streak remains active if the last day was today or yesterday; otherwise it resets to zero. Best streak and the last seven days are returned by the API. Days are explicitly labeled UTC in the UI. There are no penalties or purchases.

Every 100 XP advances a level. Existing saved conversations with user responses are backfilled during migration, once per conversation. Progress is private to the authenticated user. `GET /api/v1/progress/` supplies the complete progress model for web and future native clients; clients cannot submit XP.

## Run

The new migration is `a81d92f7c603`, following the existing local story-embedding migration `6f9e2c7a1b34`. Both are included in this checkout. Apply `alembic upgrade head` when deploying the backend; Compose's normal prestart script does this automatically.

For a standalone stack, configure this checkout's ignored `.env` and run:

```sh
FRONTEND_PORT=5174 docker compose -p memriplace-gamify up -d --build
```

Do not commit `.env`. Use a separate Compose project name to avoid altering the original checkout's containers/data.

During development, an isolated backend/database was started using the existing local backend image and a temporary Compose override, exposing the backend only at `127.0.0.1:18081`. The frontend preview runs at `http://localhost:5174`, proxying to that backend. The `Preview` account contains six explicitly synthetic example memories. It is separate from the original database and is only for viewing this design.

To restart just the frontend against that preview backend:

```sh
cd frontend
VITE_BACKEND_PROXY_TARGET=http://127.0.0.1:18081 npm run dev -- --port 5174 --host 127.0.0.1
```

## Validation and limits

The frontend TypeScript/production build passed. The full migration chain started successfully on the isolated PostgreSQL database, and the progress endpoint rendered its data in the browser. Empty and populated layouts were reviewed at desktop and phone widths, including star selection. Automated tests were not run. Reward sound playback and native iOS integration have not been verified.

The Lottie JSON and backend progress API are reusable by a native client. Framer Motion, Howler, and canvas-confetti are web implementations; an iOS client would use native equivalents for those effects.
