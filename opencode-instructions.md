# Interest Calculator → Offline Android APK (Capacitor + GitHub Actions)

## Goal
Convert this Flask web app into a **fully offline Android APK**. No backend server
call at runtime — the app must work with airplane mode ON. Build the APK
automatically via a **GitHub Actions** workflow (no local Android Studio needed).

**Important — keep the two versions separate.** All of this work happens on a
new dedicated branch, e.g. `apk`, created from `main`. `main` stays exactly as
it is today (the Flask/web version, deployable to Render). The `apk` branch
gets the Capacitor conversion described below. This way both versions live
independently and can evolve separately — a fix on `main` for the web app does
not need to touch `apk`, and vice versa.

### Branch setup (do this first, before Part 1)
```bash
git checkout main
git pull origin main
git checkout -b apk
git push -u origin apk
```
Everything below (Part 1 onward) is done **on the `apk` branch only**. The rest
of this doc assumes you are on `apk` from here on. Since `apk` is created as a
full copy of `main`, all existing files (`app.py`, `templates/`, `static/`,
etc.) are already present — no manual copying needed beyond the branch
checkout itself.

Going forward:
- Bug fixes / features for the **website** → branch off `main`, PR into `main`.
- Bug fixes / features for the **APK** → branch off `apk`, PR into `apk`.
- If a fix applies to both (e.g. a shared calculation bug), cherry-pick or
  manually port the change between branches — do not merge `apk` into `main`
  or `main` into `apk` as a whole, since their file structures diverge (see
  Part 2's new `web/` folder, `capacitor.config.json`, `android/`, etc., which
  only exist on `apk`).

## Current Architecture (context for opencode)
- Backend: Flask (`app.py`), server-rendered `templates/index.html` (uses Jinja2
  `{{ url_for(...) }}`, `{{ csrf_token() }}`).
- Frontend: `static/js/scripts.js` (~3700 lines), `static/css/styles.css`.
- Only ONE feature calls the server: the **Interest calculator** form submit
  (`POST /calculate_interest`, protected by Flask-WTF CSRF). It's handled in
  `scripts.js` around the `interestForm.addEventListener('submit', ...)` block
  (~line 1262), using `fetchWithCSRF()`, `getCSRFToken()`, `refreshCSRFToken()`.
- EMI / Split / other calculators already appear to be pure client-side JS
  (double-check while migrating — grep for any other `fetch(` calls to Flask
  routes, e.g. `grep -n "fetch(" static/js/scripts.js`).
- PWA assets already exist: `static/manifest.json`, `static/service-worker.js`,
  `static/images/icon-192x192.png`, `static/images/icon-512x512.png`,
  `static/favicon.ico`.

Because a PWA/manifest + service worker already exists, we are **not** starting
from scratch — we're wrapping the existing static frontend with Capacitor and
removing the last server dependency.

---

## Part 1 — App code changes (make it 100% client-side)

### 1.1 Port `/calculate_interest` logic to JavaScript
In `app.py`, the calculation logic is:

```python
TIME_CONVERSIONS = {
    "Years": 1, "Months": 1/12, "Days": 1/365,
    "Minutes": 1/525600, "Seconds": 1/31536000
}
COMPOUND_FREQUENCIES = {"Annually": 1, "Semi-Annually": 2, "Quarterly": 4, "Monthly": 12}
MAX_TIME_YEARS = 1000

def calculate_simple_interest(principal, rate, time):
    interest = (principal * rate * time) / 100
    total = principal + interest
    return interest, total

def calculate_compound_interest(principal, rate, time, frequency):
    n = COMPOUND_FREQUENCIES[frequency]
    amount = principal * ((1 + (rate / (100 * n))) ** (n * time))
    interest = amount - principal
    return interest, amount
```

Plus validation rules from `calculate_interest()` route:
- principal / rate / time must parse as numbers (strip commas), else field-specific
  error (`Please enter a valid amount/rate/time period`).
- reject negative principal/rate/time → `"Negative values are not allowed."`
- if `time_unit == "Years"` and `time > 1000` → `"Time period is too long (max 1000 years)."`
- if `time_unit == "Days"` and `time > 365000` → `"Date range too large (max ~1000 years)."`
- compound interest result must handle overflow (JS: check `!isFinite(amount)`) →
  `"Result too large to calculate."`
- result string format: `"{Simple|Compound} Interest: {interest:,.2f} INR<br>Total Amount: {total:,.2f} INR"`
  (2 decimal places, comma-grouped, e.g. `1,234.56`).

**Action:** Add a new function (e.g. `calculateInterestLocal(formData)`) directly
inside `static/js/scripts.js` that reimplements the above in pure JS and returns
`{ result }` or `{ error }`, mirroring the exact JSON shape the old endpoint
returned. Then replace the fetch call block:

```js
const response = await fetchWithCSRF('/calculate_interest', {
    method: 'POST',
    headers: { 'X-CSRFToken': getCSRFToken() },
    body: formData
});
const data = await response.json();
```

with a direct synchronous/local call:

```js
const data = calculateInterestLocal(formData);
```

Keep everything downstream (`data.error`, `data.result`, breakdown table, chart,
history save) unchanged — only the source of `data` changes.

Also remove now-dead code: `fetchWithCSRF`, `getCSRFToken`, `refreshCSRFToken`,
and the `refreshCSRFToken();` call on load, plus any other `fetch('/api/...')`
calls to Flask-only routes.

### 1.2 De-Jinja-ify `templates/index.html`
Move it to a plain static file, e.g. `web/index.html` (see folder layout below),
and:
- Replace `{{ url_for('static', filename='X') }}` with plain relative paths, e.g.
  `static/css/styles.css`, `static/js/scripts.js`, `static/images/icon-192x192.png`.
- Remove `<meta name="csrf-token" content="{{ csrf_token() }}">` entirely.
- Remove `<link rel="manifest" href="{{ url_for('static', filename='manifest.json') }}">`
  → change to `<link rel="manifest" href="manifest.json">` (see 1.3).
- Keep CDN `<script>`/`<link>` tags for Chart.js, jsPDF, Bootstrap Icons, Google
  Fonts as-is — Capacitor's WebView still has normal internet access if the
  phone is online, but confirm the app **still works fully offline** by testing
  with these blocked too (optional: vendor Chart.js/jsPDF/Bootstrap Icons files
  locally into `static/vendor/` and swap the CDN tags for local `<script src="static/vendor/...">`
  so charts/PDF export/icons work with zero internet — recommended for a "fully
  offline" app).

### 1.3 Fix `static/manifest.json` and `static/service-worker.js`
- In `manifest.json`, icon paths are `/static/images/...` (root-absolute). Since
  Capacitor serves the app from its own local origin (`https://localhost` on
  Android), root-absolute paths starting with `/` still resolve fine as long as
  the whole `static/` folder sits at the web root — keep the folder structure
  identical, just drop the Flask/Jinja templating layer.
- `service-worker.js` + `manifest.json` are optional inside a Capacitor APK
  (the app is already natively packaged/offline), but there's no harm leaving
  them — do NOT let the service worker try to `fetch()` `/calculate_interest`
  or any other now-removed Flask route; grep `service-worker.js` for cached
  URLs referencing removed backend routes and drop those cache entries.

### 1.4 Remove backend-only files from the packaged web app (keep them in repo
for reference/optional future web deploy, just exclude from the Capacitor
`webDir`):
`app.py`, `server.py`, `Procfile`, `render.yaml`, `requirements.txt`,
`.env.example`. These are not needed to build the APK. **Do not delete them**
unless the user says so — just make sure Capacitor's `webDir` (see 2.2) does
not pull them in.

---

## Part 2 — Add Capacitor scaffolding

### 2.1 New folder layout (recommended)
```
/                          (repo root)
├── app.py, server.py, ... (existing Flask files — unused by APK, kept for web deploy)
├── web/                   (NEW — static site Capacitor will wrap)
│   ├── index.html         (de-Jinja-ified copy of templates/index.html)
│   ├── static/
│   │   ├── css/styles.css
│   │   ├── js/scripts.js  (with calculateInterestLocal added, fetch code removed)
│   │   ├── images/...
│   │   ├── favicon.ico
│   │   ├── manifest.json
│   │   └── service-worker.js
├── package.json           (NEW)
├── capacitor.config.json  (NEW)
├── android/                (generated by `npx cap add android`, committed)
└── .github/workflows/android-build.yml   (NEW)
```

### 2.2 `package.json` (NEW, at repo root)
```json
{
  "name": "interest-calculator-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "sync": "cap sync android"
  },
  "dependencies": {
    "@capacitor/android": "^6.1.2",
    "@capacitor/core": "^6.1.2"
  },
  "devDependencies": {
    "@capacitor/cli": "^6.1.2"
  }
}
```
(opencode: check npm for the current latest 6.x/7.x patch versions and use those.)

### 2.3 `capacitor.config.json` (NEW, at repo root)
```json
{
  "appId": "com.yourcompany.interestcalculator",
  "appName": "Interest Calculator",
  "webDir": "web",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  }
}
```
Change `appId` to whatever reverse-domain identifier the user wants
(e.g. `com.<githubusername>.interestcalculator`).

### 2.4 Generate the Android project
These commands should run once (either locally by opencode inside its sandbox,
or as an idempotent step early in the CI workflow — CI is more reliable since
it guarantees a matching Node/Capacitor toolchain):
```bash
npm install
npx cap add android
npx cap sync android
```
This creates the `android/` folder (a real Gradle project). Commit `android/`
to the repo so CI doesn't need to regenerate it every run (regenerating is also
fine, just slower and can hide platform-config drift).

### 2.5 App icon / splash screen (optional but recommended)
```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor "#4a3f35" --splashBackgroundColor "#3a322c"
```
Point it at `web/static/images/icon-512x512.png` as the source icon (rename/copy
to the path `@capacitor/assets` expects, typically `assets/icon.png` +
`assets/splash.png` at repo root — check the tool's current docs since flags
change between versions).

---

## Part 3 — GitHub Actions workflow

### 3.1 New file: `.github/workflows/android-build.yml`
```yaml
name: Build Android APK

on:
  push:
    branches: [ apk ]
  workflow_dispatch: {}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install JS deps
        run: npm install

      - name: Set up JDK
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Sync Capacitor
        run: npx cap sync android

      - name: Grant execute permission for gradlew
        run: chmod +x android/gradlew

      - name: Build debug APK
        run: cd android && ./gradlew assembleDebug

      - name: Upload APK artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

This produces a **debug APK** (unsigned/self-signed by the debug keystore —
installable for testing, not for Play Store).

### 3.2 Optional: signed release APK
If the user wants a proper release build (for sharing outside debug testing or
eventually publishing to Play Store), opencode should additionally:
1. Generate a keystore (`keytool -genkeypair -v -keystore release.keystore ...`).
2. Add these as **GitHub repo secrets**: `ANDROID_KEYSTORE_BASE64`,
   `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
3. Add a workflow step before the build that decodes the base64 secret back
   into `android/app/release.keystore`.
4. Add signing config to `android/app/build.gradle` referencing env vars, and
   change the Gradle task to `./gradlew assembleRelease`.
5. Upload `android/app/build/outputs/apk/release/app-release.apk` instead.

(Skip this section for now if the user only needs a debug/test APK.)

---

## Part 4 — Verification checklist (opencode should confirm each item)
- [ ] All work happened on the `apk` branch, not `main`; `main` is untouched.
- [ ] `grep -rn "fetch(" web/static/js/scripts.js` returns no calls to any
      Flask route (`/calculate_interest`, `/api/csrf-token`, etc.)
- [ ] `web/index.html` has zero `{{ ... }}` Jinja syntax left.
- [ ] Interest calculator gives identical results to the old server version for
      a few manual test cases (simple + compound, each time unit, each
      compounding frequency) — compare against `calculate_simple_interest` /
      `calculate_compound_interest` formulas above.
- [ ] App loads and the interest form fully works with the device's Wi-Fi/mobile
      data turned OFF (true offline test) — including chart rendering and PDF
      export if those libraries were vendored locally per step 1.2.
  - [ ] `npx cap sync android` runs with no errors.
- [ ] `.github/workflows/android-build.yml` runs on push and produces a
      downloadable `app-debug.apk` artifact.
- [ ] APK installs on a real device/emulator and the calculator works end to end.

---

## Notes / things opencode should decide sensibly
- Do all of this on the `apk` branch. Never merge `apk` → `main` wholesale.
- Keep the existing Flask app (`app.py`, etc.) in the `apk` branch's copy of the
  repo untouched aside from what's explicitly needed — it can remain useful if
  the user later wants a web version deployed to Render from that branch too.
  Just make sure it's excluded from `capacitor.config.json`'s `webDir`.
- Do NOT delete `static/manifest.json` / `static/service-worker.js` — they're
  harmless inside the APK and useful if the same `web/` folder is ever also
  hosted as a PWA.
- Pick reasonable current versions for `@capacitor/core`, `@capacitor/cli`,
  `@capacitor/android` (they must all match) rather than guessing an old pin.
