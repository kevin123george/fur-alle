#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"
LOGS="$ROOT/.logs"
mkdir -p "$LOGS"

G='\033[0;32m' Y='\033[0;33m' R='\033[0;31m' B='\033[0;34m' C='\033[0;36m' N='\033[0m'
ok()   { echo -e "${G}✓${N} $1"; }
warn() { echo -e "${Y}!${N} $1"; }
fail() { echo -e "${R}✗${N} $1"; exit 1; }
step() { echo -e "\n${B}▶${N} $1"; }
info() { echo -e "${C}i${N} $1"; }

# ── Mode selection ─────────────────────────────────────────────────────────
echo ""
echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "${B}  Für Alle${N}"
echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo ""
echo "  1) Docker Compose   (server / Umbrel / remote device)"
echo "  2) Local dev        (requires Java 21, Bun, Python venv)"
echo ""
read -rp "  Auswahl [1/2]: " MODE_CHOICE
echo ""

case "$MODE_CHOICE" in
    1) RUN_MODE="docker" ;;
    2) RUN_MODE="local"  ;;
    *) fail "Ungültige Auswahl — bitte 1 oder 2 eingeben." ;;
esac


# ════════════════════════════════════════════════════════════════════════════
# DOCKER MODE
# ════════════════════════════════════════════════════════════════════════════
if [ "$RUN_MODE" = "docker" ]; then

    command -v docker > /dev/null 2>&1 || fail "docker not found."

    # Auto-detect if sudo is needed
    if docker ps > /dev/null 2>&1; then
        DOCKER="docker"
    elif sudo docker ps > /dev/null 2>&1; then
        DOCKER="sudo docker"
        ok "sudo docker erforderlich"
    else
        fail "docker nicht erreichbar (auch nicht mit sudo)."
    fi

    # ── Port ────────────────────────────────────────────────────────────────
    PORT=$(grep -E "^PORT=" "$ROOT/.env" 2>/dev/null | cut -d= -f2)
    PORT="${PORT:-3001}"
    echo "PORT=$PORT" > "$ROOT/.env"
    ok "Port $PORT"

    # ── Tailscale Funnel ────────────────────────────────────────────────────
    echo ""
    read -rp "  Tailscale Funnel aktivieren? [y/N]: " FUNNEL_CHOICE
    FUNNEL=false
    TS_CONTAINER=""
    if [[ "$FUNNEL_CHOICE" =~ ^[Yy]$ ]]; then
        FUNNEL=true
        # Auto-detect tailscale container, fall back to known Umbrel default
        TS_AUTO=$($DOCKER ps --format '{{.Names}}' 2>/dev/null | grep -i tailscale | head -1)
        DEFAULT_TS="${TS_AUTO:-tailscale_web_1}"
        read -rp "  Tailscale container [$DEFAULT_TS]: " INPUT_TS
        TS_CONTAINER="${INPUT_TS:-$DEFAULT_TS}"
    fi

    # ── Rebuild? ─────────────────────────────────────────────────────────────
    echo ""
    read -rp "  Images neu bauen? [y/N]: " REBUILD_CHOICE
    BUILD_FLAG=""
    [[ "$REBUILD_CHOICE" =~ ^[Yy]$ ]] && BUILD_FLAG="--build"

    # ── Start services ───────────────────────────────────────────────────────
    step "Docker Compose starten"
    (cd "$ROOT" && $DOCKER compose down 2>/dev/null; $DOCKER compose up -d $BUILD_FLAG) \
        || fail "docker compose up fehlgeschlagen"

    # ── Wait for frontend ────────────────────────────────────────────────────
    printf "\n  Warte auf Frontend"
    for i in $(seq 1 40); do
        if curl -sf "http://localhost:$PORT/" > /dev/null 2>&1; then
            echo ""; break
        fi
        printf "."; sleep 2
    done
    echo ""

    # ── Migration status ─────────────────────────────────────────────────────
    MIGRATE_CID=$($DOCKER ps -a --filter "name=migrate" --format '{{.ID}}' 2>/dev/null | head -1)
    MIGRATE_EXIT=$($DOCKER inspect --format='{{.State.ExitCode}}' "$MIGRATE_CID" 2>/dev/null || echo "?")
    if [ "$MIGRATE_EXIT" = "0" ]; then
        ok "Migrationen erfolgreich"
    else
        warn "Migration exit=$MIGRATE_EXIT — prüfe: docker compose logs migrate"
    fi

    # ── Tailscale Funnel ─────────────────────────────────────────────────────
    FUNNEL_URL=""
    if [ "$FUNNEL" = true ] && [ -n "$TS_CONTAINER" ]; then
        step "Tailscale Funnel"
        $DOCKER exec "$TS_CONTAINER" tailscale funnel --bg "$PORT" \
            || warn "Funnel konnte nicht gestartet werden — manuell: $DOCKER exec $TS_CONTAINER tailscale funnel --bg $PORT"
        # Try to get public hostname
        TS_HOST=$($DOCKER exec "$TS_CONTAINER" tailscale status --json 2>/dev/null \
            | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Self',{}).get('DNSName','').rstrip('.'))" 2>/dev/null)
        [ -n "$TS_HOST" ] && FUNNEL_URL="https://$TS_HOST"
    fi

    # ── Summary ──────────────────────────────────────────────────────────────
    echo ""
    echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
    echo -e "${G}  Für Alle läuft  🇩🇪${N}"
    echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
    printf "  %-16s %s\n" "Lokal:"        "http://localhost:$PORT"
    [ -n "$FUNNEL_URL" ] && \
    printf "  %-16s %s\n" "Öffentlich:"   "$FUNNEL_URL"
    printf "  %-16s %s\n" "Logs:"         "$DOCKER compose logs -f"
    printf "  %-16s %s\n" "Stoppen:"      "$DOCKER compose down"
    printf "  %-16s %s\n" "Reset (vol):"  "$DOCKER compose down -v"
    echo ""
    exit 0
fi


# ════════════════════════════════════════════════════════════════════════════
# LOCAL MODE
# ════════════════════════════════════════════════════════════════════════════

# ── Flag parsing ─────────────────────────────────────────────────────────────
REBUILD=false
INIT=false

for arg in "$@"; do
    case "$arg" in
        --rebuild) REBUILD=true ;;
        --init)    INIT=true ;;
        --help|-h)
            echo "Local mode flags:"
            echo "  --init       Seed all empty tables on startup"
            echo "  --rebuild    Force Maven JAR rebuild"
            exit 0 ;;
        *) warn "Unknown flag: $arg  (try --help)" ;;
    esac
done

API_PID="" ETL_PID="" FRONTEND_PID=""
INIT_PIDS=()
START_TIME=$(date +%s)

elapsed() { echo $(( $(date +%s) - START_TIME ))s; }

cleanup() {
    echo ""
    echo "Shutting down…"
    [ -n "$API_PID" ]      && kill "$API_PID"      2>/dev/null
    [ -n "$ETL_PID" ]      && kill "$ETL_PID"      2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
    for PID in "${INIT_PIDS[@]}"; do kill "$PID" 2>/dev/null; done
    wait 2>/dev/null
    echo "Stopped after $(elapsed)."
}
trap cleanup INT TERM

# ── Prerequisites ─────────────────────────────────────────────────────────────
step "Checking prerequisites"

command -v java   > /dev/null 2>&1 || fail "java not found. Install JDK 21+."
command -v bun    > /dev/null 2>&1 || fail "bun not found. See bun.sh."
command -v psql   > /dev/null 2>&1 || fail "psql not found. Install PostgreSQL."
[ -f "$ROOT/etl/.venv/bin/python" ] \
    || fail "Python venv missing. Run:\n  cd etl && python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt"

ok "java $(java -version 2>&1 | awk -F'"' '/version/{print $2}')"
ok "bun  $(bun --version)"
ok "Python venv present"

# ── Kill stale ports ──────────────────────────────────────────────────────────
step "Clearing ports"
for PORT in 8080 5173; do
    PID=$(lsof -ti tcp:"$PORT" 2>/dev/null || true)
    if [ -n "$PID" ]; then
        warn "Port $PORT busy (PID $PID) — killing"
        kill "$PID" 2>/dev/null; sleep 0.5
    fi
done
ok "Ports 8080 and 5173 free"

# ── PostgreSQL + migrations ───────────────────────────────────────────────────
step "Database"
psql -d fueralle -c "SELECT 1" > /dev/null 2>&1 \
    || fail "Cannot reach database 'fueralle'.\n  Fix: createdb fueralle"
ok "PostgreSQL — fueralle reachable"

for MIG in "$ROOT"/db/migrations/*.sql; do
    psql -d fueralle -q -f "$MIG" 2>/dev/null
done
ok "Migrations applied"

# ── Data status ───────────────────────────────────────────────────────────────
step "Data status"

declare -A SOURCES=(
    [energy]="energy_current"
    [employment]="employment_current"
    [vacancies]="vacancies_current"
    [zensus]="demographics_current"
    [kba]="vehicles_current"
    [bundestagswahl]="election_current"
    [mastr]="renewables_current"
)
declare -A SOURCE_LABEL=(
    [energy]="Energy (SMARD)"
    [employment]="Employment — ~2 min"
    [vacancies]="Vacancies — ~2 min"
    [zensus]="Zensus 2022 (Destatis)"
    [kba]="KBA Fahrzeuge"
    [bundestagswahl]="Bundestagswahl 2021"
    [mastr]="MaStR Erneuerbare — ~10 min"
)
SOURCE_ORDER=(energy employment vacancies zensus kba bundestagswahl mastr)

MISSING=()
for src in "${SOURCE_ORDER[@]}"; do
    table="${SOURCES[$src]}"
    count=$(psql -d fueralle -tAc "SELECT count(*) FROM $table" 2>/dev/null | tr -d ' ')
    if [ "${count:-0}" -gt 0 ]; then
        ok "${SOURCE_LABEL[$src]} — $count rows"
    else
        warn "${SOURCE_LABEL[$src]} — empty"
        MISSING+=("$src")
    fi
done

# ── --init: seed empty tables ─────────────────────────────────────────────────
seed_source() {
    local src="$1"
    local table="${SOURCES[$src]}"
    local label="${SOURCE_LABEL[$src]}"
    local count
    count=$(psql -d fueralle -tAc "SELECT count(*) FROM $table" 2>/dev/null | tr -d ' ')
    if [ "${count:-0}" -gt 0 ]; then
        ok "$label — already seeded, skipping"; return
    fi
    info "$label — seeding → .logs/init-${src}.log"
    (
        cd "$ROOT/etl"
        .venv/bin/python run_once.py "$src" > "$LOGS/init-${src}.log" 2>&1
        EXIT=$?
        ROWS=$(psql -d fueralle -tAc "SELECT count(*) FROM $table" 2>/dev/null | tr -d ' ')
        if [ $EXIT -eq 0 ] && [ "${ROWS:-0}" -gt 0 ]; then
            echo -e "${G}✓ $label seeded ($ROWS rows)${N}"
        else
            echo -e "${Y}! $label finished with issues — check .logs/init-${src}.log${N}"
        fi
    ) &
    INIT_PIDS+=($!)
}

if [ "$INIT" = true ] && [ ${#MISSING[@]} -gt 0 ]; then
    step "Initial data load (--init)"
    FAST=(energy zensus kba bundestagswahl)
    for src in "${FAST[@]}"; do
        [[ " ${MISSING[*]} " == *" $src "* ]] && seed_source "$src"
    done
    FAST_PIDS=("${INIT_PIDS[@]}")
    if [ ${#FAST_PIDS[@]} -gt 0 ]; then
        printf "   Waiting for fast sources"
        for PID in "${FAST_PIDS[@]}"; do wait "$PID" 2>/dev/null && printf "."; done
        echo ""
    fi
    MEDIUM=(employment vacancies)
    for src in "${MEDIUM[@]}"; do
        [[ " ${MISSING[*]} " == *" $src "* ]] && seed_source "$src"
    done
    [[ " ${MISSING[*]} " == *" mastr "* ]] && seed_source mastr
    ok "Background jobs started — dashboard live immediately"
    info "Monitor: tail -f $LOGS/init-*.log"
elif [ "$INIT" = false ] && [ ${#MISSING[@]} -gt 0 ]; then
    echo ""
    info "Run ${Y}bash start.sh --init${N} to seed missing tables automatically."
fi

# ── Build API JAR ─────────────────────────────────────────────────────────────
step "API"
JAR="$ROOT/api/target/api-0.0.1-SNAPSHOT.jar"
NEED_BUILD=false
if [ "$REBUILD" = true ]; then
    NEED_BUILD=true; warn "Forced rebuild (--rebuild)"
elif [ ! -f "$JAR" ]; then
    NEED_BUILD=true; warn "JAR not found — building"
elif [ -n "$(find "$ROOT/api/src" -name "*.java" -newer "$JAR" 2>/dev/null | head -1)" ]; then
    NEED_BUILD=true; warn "Source changed — rebuilding"
fi
if [ "$NEED_BUILD" = true ]; then
    BUILD_START=$(date +%s)
    (cd "$ROOT/api" && ./mvnw -q package -DskipTests 2>&1 | tee "$LOGS/build.log") \
        || fail "Build failed — see .logs/build.log"
    ok "Built in $(( $(date +%s) - BUILD_START ))s"
else
    ok "JAR up to date"
fi

# ── ETL scheduler ─────────────────────────────────────────────────────────────
step "ETL Scheduler"
(cd "$ROOT/etl" && .venv/bin/python scheduler.py > "$LOGS/etl.log" 2>&1) &
ETL_PID=$!
sleep 0.3
kill -0 "$ETL_PID" 2>/dev/null || fail "ETL scheduler exited immediately — check .logs/etl.log"
ok "ETL scheduler (PID $ETL_PID)"

# ── Spring Boot ───────────────────────────────────────────────────────────────
step "Spring Boot API"
java -jar "$JAR" > "$LOGS/api.log" 2>&1 &
API_PID=$!
printf "   Waiting"
API_UP=false
for i in $(seq 1 45); do
    kill -0 "$API_PID" 2>/dev/null || { echo ""; fail "API process died — check .logs/api.log"; }
    if curl -sf http://localhost:8080/api/stats > /dev/null 2>&1; then
        API_UP=true; break
    fi
    printf "."; sleep 1
done
echo ""
$API_UP || fail "API did not respond in 45s — check .logs/api.log"
ok "API ready ($(elapsed) total)"

# ── Bun frontend ──────────────────────────────────────────────────────────────
step "Frontend"
(cd "$ROOT/frontend" && bun dev > "$LOGS/frontend.log" 2>&1) &
FRONTEND_PID=$!
printf "   Waiting"
FE_UP=false
for i in $(seq 1 20); do
    kill -0 "$FRONTEND_PID" 2>/dev/null || { echo ""; fail "Frontend process died — check .logs/frontend.log"; }
    if curl -sf http://localhost:5173/ > /dev/null 2>&1; then
        FE_UP=true; break
    fi
    printf "."; sleep 0.5
done
echo ""
$FE_UP || warn "Frontend not responding yet — check .logs/frontend.log"
ok "Frontend ready ($(elapsed) total)"
open "http://localhost:5173" 2>/dev/null || true

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "${G}  Für Alle läuft · Ctrl+C zum Beenden${N}"
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
printf "  %-14s %s\n" "Dashboard:"  "http://localhost:5173"
printf "  %-14s %s\n" "API:"        "http://localhost:8080/api/stats"
printf "  %-14s %s\n" "Logs:"       ".logs/{api,etl,frontend}.log"
echo ""
printf "  %-14s %s\n" "Flags:"      "--init     seed empty tables on startup"
printf "  %-14s %s\n" ""            "--rebuild  force Maven JAR rebuild"
if [ "$INIT" = true ] && [ ${#MISSING[@]} -gt 0 ]; then
    echo ""
    info "Init in progress — tail -f $LOGS/init-*.log"
fi
echo ""

wait
