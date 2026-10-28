# BrightWays

Educational platform for children with neurodivergence (autism, ADHD, dyslexia) featuring interactive activities and progress tracking.

## What It Does

BrightWays delivers tailored learning activities with real-time progress monitoring for children and caregivers. Features customized exercises by condition type, analytics dashboards, and multi-child management.

## How It's Made

**Backend**: Node.js, Express.js, Bcrypt, Socket.io  
**Frontend**: HTML5, CSS3, JavaScript  
**Database**: MySQL with normalized schema  

**Core entities**: Users (child/caregiver), Activities, Progress tracking, Sessions, Child profiles

## Session-based sign-in

The backend stores authenticated sessions in MySQL and sends the browser an HTTP-only `bw.sid` cookie. Set a strong, private `SESSION_SECRET` in `backend/.env` before starting the server. Login and registration create a session; `GET /api/session` checks it and `POST /api/session/logout` ends it.

Activity, child-dashboard, and caregiver-dashboard APIs require a valid session and the matching account role. They use the account ID from the session rather than trusting IDs sent by the browser. Serve the frontend from the same origin as the backend so the browser sends the session cookie with API requests.

## License

ISC License
