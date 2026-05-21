#!/usr/bin/env python3
"""
Batch-generate Japanese Ink map backgrounds for all 400 German Kreise via Terraink.
Captures the WebGL canvas directly — no download dialog, no ad-block limits.

Usage:
  python3 scripts/generate_posters.py [--resume]

Requirements:
  pip install playwright && playwright install chromium
  Terraink running on http://localhost:5173  (cd ~/terraink && bun dev)

Output:
  frontend/public/posters/{ags}.png   — map background per Kreis
"""

import argparse
import base64
import json
import math
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

from playwright.sync_api import sync_playwright

TERRAINK_URL  = "http://localhost:5173"
GEOJSON_PATH  = Path(__file__).parent.parent / "frontend/public/kreise.geo.json"
OUTPUT_DIR    = Path(__file__).parent.parent / "frontend/public/posters"
THEME         = "Japanese Ink"

# Viewport larger than 1920×1080 so the Desktop Full HD canvas fits with the sidebar
VIEWPORT = {"width": 2560, "height": 1440}

# Germany overall + all 16 Bundesländer centroids
EXTRA_LOCATIONS = [
    {"ags": "de",  "name": "Deutschland",         "lat": 51.1657,  "lon": 10.4515},
    {"ags": "01",  "name": "Schleswig-Holstein",  "lat": 54.2194,  "lon":  9.6961},
    {"ags": "02",  "name": "Hamburg",             "lat": 53.5753,  "lon": 10.0153},
    {"ags": "03",  "name": "Niedersachsen",       "lat": 52.6367,  "lon":  9.8451},
    {"ags": "04",  "name": "Bremen",              "lat": 53.0793,  "lon":  8.8017},
    {"ags": "05",  "name": "Nordrhein-Westfalen", "lat": 51.4332,  "lon":  7.6616},
    {"ags": "06",  "name": "Hessen",              "lat": 50.6521,  "lon":  9.1624},
    {"ags": "07",  "name": "Rheinland-Pfalz",     "lat": 50.1183,  "lon":  7.3089},
    {"ags": "08",  "name": "Baden-Württemberg",   "lat": 48.6616,  "lon":  9.3501},
    {"ags": "09",  "name": "Bayern",              "lat": 48.7904,  "lon": 11.4979},
    {"ags": "10",  "name": "Saarland",            "lat": 49.3964,  "lon":  7.0228},
    {"ags": "11",  "name": "Berlin",              "lat": 52.5200,  "lon": 13.4050},
    {"ags": "12",  "name": "Brandenburg",         "lat": 52.4125,  "lon": 12.5316},
    {"ags": "13",  "name": "Mecklenburg-Vorpommern", "lat": 53.6126, "lon": 12.4295},
    {"ags": "14",  "name": "Sachsen",             "lat": 51.1045,  "lon": 13.2017},
    {"ags": "15",  "name": "Sachsen-Anhalt",      "lat": 51.9503,  "lon": 11.6923},
    {"ags": "16",  "name": "Thüringen",           "lat": 51.0099,  "lon": 11.0079},
]


# ── helpers ────────────────────────────────────────────────────────────────────

def load_kreise() -> list[dict]:
    with open(GEOJSON_PATH) as f:
        gj = json.load(f)
    return [
        {
            "ags":  feat["properties"]["krs_code"][0],
            "name": feat["properties"]["krs_name"][0],
            "lat":  feat["properties"]["geo_point_2d"]["lat"],
            "lon":  feat["properties"]["geo_point_2d"]["lon"],
        }
        for feat in gj["features"]
    ]


def js_click(page, expr: str, delay: float = 0.4) -> None:
    page.evaluate(f"() => {{ const el = {expr}; if (el) el.click(); }}")
    time.sleep(delay)


def fill_input(page, name_attr: str, value: str) -> None:
    page.evaluate(
        """([n, v]) => {
            const inp = document.querySelector('input[name="' + n + '"]');
            if (!inp) return;
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            setter.call(inp, v);
            inp.dispatchEvent(new Event('input',  { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
        }""",
        [name_attr, value],
    )


def capture_canvas(page) -> bytes:
    """Grab the largest WebGL canvas as PNG bytes via toDataURL.
    preserveDrawingBuffer is forced true in INIT_SCRIPT so the framebuffer is never cleared."""
    data_url = page.evaluate("""() => {
        // Pick the largest canvas — that's the map, not any UI micro-canvas
        const canvases = Array.from(document.querySelectorAll('canvas'));
        const c = canvases.sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];
        return c ? c.toDataURL('image/png') : null;
    }""")
    if not data_url:
        raise RuntimeError("No canvas found on page")
    _, b64 = data_url.split(",", 1)
    return base64.b64decode(b64)


# ── setup ──────────────────────────────────────────────────────────────────────

INIT_SCRIPT = """
    // Force preserveDrawingBuffer so canvas.toDataURL() always captures the last frame.
    // MapLibre defaults to false for performance; we override before it calls getContext.
    const _getCtx = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, attrs) {
        if (type === 'webgl' || type === 'webgl2') {
            attrs = Object.assign({}, attrs, { preserveDrawingBuffer: true });
        }
        return _getCtx.call(this, type, attrs);
    };

    // Patch .adsbox dimensions so ad-block detection always reports clean
    const _H = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    const _W = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get() {
        return (this.className && String(this.className).includes('adsbox')) ? 1 : _H.get.call(this);
    }});
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth',  { configurable: true, get() {
        return (this.className && String(this.className).includes('adsbox')) ? 1 : _W.get.call(this);
    }});
"""


def boot_app(page) -> None:
    page.goto(TERRAINK_URL)
    page.wait_for_load_state("networkidle")
    time.sleep(1)
    page.locator('input[placeholder="Type a city or place"]').first.fill("Berlin")
    time.sleep(1.5)
    s = page.query_selector("text=Berlin, Deutschland")
    if s:
        s.click()
    time.sleep(0.5)
    page.click('button:has-text("OK")')
    time.sleep(3)


def enable_all_layers(page) -> None:
    # Open the Layers section in the nav bar (label is "Layers", not "LAYERS")
    js_click(page, "Array.from(document.querySelectorAll('button')).find(b=>b.innerText.trim()==='Layers')")
    time.sleep(0.5)
    # Programmatic .click() on the INPUT element bypasses the theme-switch-track span
    # and triggers React's synthetic onClick → onChange → SET_FIELD dispatch.
    # The setter+change approach does not work for checkboxes in React 17+ because
    # React resolves onChange via click events, not bare change events.
    page.evaluate("""() => {
        document.querySelectorAll('input[type="checkbox"]').forEach(inp => {
            if (!inp.checked) inp.click();
        });
    }""")
    time.sleep(2)  # Let map re-render with new layer state
    print("  Layers: all enabled")


def set_layout(page) -> None:
    js_click(page, "Array.from(document.querySelectorAll('button')).find(b=>b.innerText.trim()==='LAYOUT'&&b.offsetParent)")
    time.sleep(0.4)
    # Desktop Full HD — landscape, matches typical web viewport
    page.evaluate("() => Array.from(document.querySelectorAll('button')).find(b=>b.innerText.includes('Desktop Full HD')).click()")
    time.sleep(0.5)
    js_click(page, "Array.from(document.querySelectorAll('button')).find(b=>b.innerText.trim()==='LAYOUT'&&b.offsetParent)")
    time.sleep(8)  # Canvas resizes + MapLibre reinits WebGL + tiles reload
    print("  Layout: Desktop Full HD (1920×1080)")


def set_theme(page) -> None:
    # Note: theme buttons have no offsetParent (inside fixed panel) — don't filter by it
    js_click(page, "Array.from(document.querySelectorAll('button')).find(b=>b.innerText.trim()==='THEME'&&b.offsetParent)")
    js_click(page, f"Array.from(document.querySelectorAll('button')).find(b=>b.innerText.trim()==='{THEME}')", delay=2)
    print(f"  Theme: {THEME}")


def set_location(page, lat: float, lon: float, name: str) -> None:
    js_click(page, "Array.from(document.querySelectorAll('button')).find(b=>b.innerText.trim()==='LOCATION'&&b.offsetParent)")
    fill_input(page, "latitude",  str(round(lat, 6)))
    fill_input(page, "longitude", str(round(lon, 6)))
    fill_input(page, "city",      name)
    time.sleep(4)  # Wait for map to pan and tiles to load at new location
    # Close location panel
    js_click(page, "Array.from(document.querySelectorAll('button')).find(b=>b.innerText.trim()==='LOCATION'&&b.offsetParent)")


# ── worker ─────────────────────────────────────────────────────────────────────

def run_worker(chunk: list[dict], worker_id: int, resume: bool) -> tuple[int, int, int]:
    """One browser instance processes its slice of kreise. Returns (done, skipped, errors)."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=True,
            args=["--use-gl=angle", "--use-angle=swiftshader"],
        )
        page = browser.new_page(viewport=VIEWPORT)
        page.add_init_script(INIT_SCRIPT)

        boot_app(page)
        set_theme(page)
        set_layout(page)
        enable_all_layers(page)

        done = skipped = errors = 0
        total = len(chunk)
        prefix = f"W{worker_id}" if worker_id else ""

        for i, kreis in enumerate(chunk, 1):
            ags  = kreis["ags"]
            name = kreis["name"]
            out  = OUTPUT_DIR / f"{ags}.png"

            if resume and out.exists():
                print(f"  [{prefix} {i}/{total}] {ags} — skip")
                skipped += 1
                continue

            print(f"  [{prefix} {i}/{total}] {ags}  {name}")
            try:
                set_location(page, kreis["lat"], kreis["lon"], name)
                img = capture_canvas(page)
                out.write_bytes(img)
                done += 1
                print(f"  [{prefix}]          → {len(img):,} bytes")
            except Exception as e:
                print(f"  [{prefix}]          ERROR: {e}")
                errors += 1

        browser.close()

    return done, skipped, errors


# ── main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--resume",  action="store_true", help="Skip Kreise that already have a file")
    parser.add_argument("--ags",     help="Generate only a single Kreis by AGS code (for testing)")
    parser.add_argument("--workers", type=int, default=1, help="Number of parallel browser instances (default: 1)")
    args = parser.parse_args()

    kreise = EXTRA_LOCATIONS + load_kreise()
    if args.ags:
        kreise = [k for k in kreise if k["ags"] == args.ags]
        if not kreise:
            print(f"AGS {args.ags} not found")
            sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    n_workers = min(args.workers, len(kreise))
    total = len(kreise)
    print(f"Generating {total} poster(s) → {OUTPUT_DIR}  (workers: {n_workers})")

    if n_workers == 1:
        done, skipped, errors = run_worker(kreise, 0, args.resume)
    else:
        chunk_size = math.ceil(total / n_workers)
        chunks = [kreise[i:i + chunk_size] for i in range(0, total, chunk_size)]

        done = skipped = errors = 0
        with ProcessPoolExecutor(max_workers=n_workers) as pool:
            futures = {
                pool.submit(run_worker, chunk, idx + 1, args.resume): idx
                for idx, chunk in enumerate(chunks)
            }
            for fut in as_completed(futures):
                d, s, e = fut.result()
                done += d; skipped += s; errors += e

    print(f"\nDone. {done} generated, {skipped} skipped, {errors} errors.")


if __name__ == "__main__":
    main()
