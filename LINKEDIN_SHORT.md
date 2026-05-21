I'm a backend dev. I don't do frontend.

Or at least, I didn't.

Three weeks ago I couldn't tell you the difference between a hook and a component. Today I shipped a full-stack civic data dashboard for Germany's 400+ districts — solo, spare time — and it looks good.

Here's the breakdown:

——

THE STACK

Python ETL → PostgreSQL ← Spring Boot API ← React Frontend

Three decoupled layers. Postgres is the only thing they share. Spring Boot is my comfort zone. The React side? Built entirely with Claude Code. I wrote the backend. Claude wrote the frontend. That's the truth.

——

THE INFRASTRUCTURE

Everything runs on a mini home server in Docker. No open ports — traffic routes through a Cloudflare Tunnel. I deploy and access the server from anywhere via Tailscale. No CI/CD pipeline. One bash script: rsync the code, docker compose up, done. Sometimes simple beats clever.

——

WHAT IT DOES

Pick any of Germany's 400+ Landkreise. You get unemployment rate, GDP per capita, population density, broadband coverage, EV adoption, election results — all from official open data, all credited inline.

Any district also generates a shareable card. And a live news panel pulling RSS headlines per district. Zero extra infrastructure for either.

——

THE TOOLS

LazyVim because a fast editor gets out of your way. Claude Code because I can't do frontend — and it can.

——

TOTAL RUNNING COST: €2/year.

The server I already owned. The domain cost €2. Cloudflare Tunnel is free.

No login. No ads. No tracking.

🔗 fueralle.byastra.de
🔗 regiohub.byastra.de
🐙 github.com/kevin123george/fur-alle

#buildinpublic #fullstack #opendata #germany #selfhosted #python #java #react #terraink
