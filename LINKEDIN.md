I'm a backend dev. I don't do frontend.

Or at least, I didn't.

Three weeks ago I couldn't have told you the difference between a hook and a component. Today I shipped a full-stack civic data dashboard for Germany's 400+ districts — solo, spare time — and it looks good.

Here's the breakdown of how:

---

**The stack:**

Python ETL → PostgreSQL ← Spring Boot API ← React Frontend

Three completely decoupled layers. PostgreSQL is the only thing they share.

- **Spring Boot 3 (Java 21)** — my comfort zone. Read-only REST, typed DTOs, nothing fancy.
- **Python 3.12 + APScheduler + Pydantic v2** — each data source has its own fetcher. Writes to a staging table first, promotes to live only after full validation. Pandas was born for messy government CSV formats.
- **Bun + React + TypeScript + Recharts + Leaflet + DaisyUI** — the part I couldn't have built alone two years ago.

---

**The infrastructure:**

I was done with cloud vendor lock-in. AWS, GCP, Azure — you go deep on one and suddenly you're writing code for their platform, not your problem.

So I repurposed my existing home server.

Everything runs in Docker containers orchestrated with Compose. No open ports. Zero. Everything routes through a Cloudflare Tunnel — outbound-only, the internet never touches my IP directly.

No GitHub Actions. No CI/CD pipeline. Just a plain bash script — rsync the code over SSH, docker compose up -d --build, and it's live. Sometimes simple beats clever.

And here's what people miss: it scales indefinitely. Today it's a home server. Tomorrow I can bring up the exact same stack on a VPS or bare metal — no code changes, no re-architecture. The containers don't care where they run. That's the whole point.

---

**What it actually does:**

Pick any of Germany's 400+ Landkreise. You get unemployment rate, GDP per capita, population density, broadband coverage, housing costs, healthcare access, EV adoption, commuter flows, election results — all from official open data, all credited inline, all with the data date shown.

Any Kreis also generates a shareable 1080×1080 PNG — overview, economy, social, population, labour market, mobility, or map variant. No server-side rendering, no headless browser — just the DOM captured client-side and handed to you as a file.

And a local news panel. Every Kreis page pulls RSS headlines from Google News filtered by district name. Zero infrastructure, zero cost, always fresh.

---

**The freedom no one talks about:**

At work you inherit the stack. Here I got to pick every piece.

Python because Pandas handles messy government data better than anything else. Java because Spring Boot is bulletproof for a read-only API. Bun because it's fast and doesn't get in the way. No politics, no "we're a Java shop", no approval process.

That freedom is underrated. Use the right tool for the job — not the approved one.

One more thing worth mentioning: this entire project was written in **LazyVim**, and the entire frontend was built with **Claude Code**. I wrote the backend. Claude wrote the React. LazyVim because a fast editor gets out of your way. Claude Code because having an AI that understands your whole codebase — not just a file at a time — is a genuinely different category of tool. I couldn't have shipped a frontend at all without it.

---

**Data sources:**
SMARD · Bundesagentur für Arbeit · Destatis · Marktstammdatenregister · KBA · Bundeswahlleiter · DWD · OpenStreetMap

All public. All free. Every chart credits its source inline.

---

The era of "I'm a backend dev, I can't ship a product" is over.

**Total running cost: €2/year.**

The server is an Intel N97 mini PC I already owned — €0 additional. The domain cost €2 for the year. Subdomains are free. Cloudflare Tunnel is free. No hosting bill, no compute bill, no bandwidth bill.

A comparable setup on a cloud provider — managed database, compute, egress — would run €50–100/month easily.

---

No login. No ads. No tracking.
🔗 fueralle.byastra.de

#buildinpublic #fullstack #opendata #germany #selfhosted #cloudflare #python #java #react
