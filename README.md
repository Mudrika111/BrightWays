# BrightWays

Educational platform for children with neurodivergence (autism, ADHD, dyslexia) featuring interactive activities and progress tracking.

## What It Does

BrightWays delivers tailored learning activities with real-time progress monitoring for children and caregivers. Features customized exercises by condition type, analytics dashboards, and multi-child management.

The child dashboard offers 21 activities across its three learning profiles. New activities use short, self-paced interactions, clear instructions, reversible choices, and encouraging feedback. Literacy games practise building words from letters and word parts; choice-based activities let children decide what feels right for them. These are learning and play activities, not diagnostic or therapeutic tools.

## Activity design references

- [CAST: Universal Design for Learning](https://www.cast.org/what-we-do/universal-design-for-learning) — meaningful options for engagement, representation, and action.
- [What Works Clearinghouse: Foundational Skills to Support Reading for Understanding in Kindergarten Through 3rd Grade](https://ies.ed.gov/ncee/wwc/PracticeGuide/21) — evidence ratings for linking speech sounds to letters and decoding words.
- [International Dyslexia Association: Effective Reading Instruction](https://dyslexiaida.org/effective-reading-instruction/) — explicit, systematic instruction in phonology, sound-symbol association, and word parts.
- [W3C: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) — guidance on reducing nonessential motion and respecting motion preferences.
- [National Autistic Society: Autism and communication](https://www.autism.org.uk/advice-and-guidance/about-autism/autism-and-communication) — communication varies; support choices should not assume one response fits everyone.

## How It's Made

**Backend**: Node.js, Express.js, Bcrypt, Socket.io  
**Frontend**: React, TypeScript, Vite, CSS
**Backend**: Node.js, Express.js, TypeScript, Bcrypt, Socket.io
**Database**: MySQL with normalized schema

**Core entities**: Users (child/caregiver), Activities, Progress tracking, Sessions, Child profiles

## Session-based sign-in

The backend stores authenticated sessions in MySQL and sends the browser an HTTP-only `bw.sid` cookie. Set a strong, private `SESSION_SECRET` in `backend/.env` before starting the server. Login and registration create a session; `GET /api/session` checks it and `POST /api/session/logout` ends it.

Activity, child-dashboard, and caregiver-dashboard APIs require a valid session and the matching account role. They use the account ID from the session rather than trusting IDs sent by the browser. Serve the frontend from the same origin as the backend so the browser sends the session cookie with API requests.

## Frontend development

The React app keeps the existing `.html` page URLs and styles. From the project root, run `npm install` once and use `npm run dev` for Vite development. Vite forwards `/api` requests to the backend at `http://localhost:5000`; start the backend separately with `npm start` in `backend`.

The frontend and backend are written in TypeScript. Run `npm run typecheck` to check both projects. For production, `npm run build` compiles the backend and creates `frontend/dist`. Starting the backend with `npm start` builds the frontend first, then serves that build and routes the existing page URLs to the React app.

Dashboard completion and caregiver activity history use the activity card selected by the child. The backend creates `activity_sessions` when it starts and adds the `activity_key` column to older versions of that table; historical records without that key are shown as previous activities because their exact card cannot be determined. When running `backend/table.sql` manually, select the database configured by `DB_NAME` in `backend/.env` first.

## License

ISC License
