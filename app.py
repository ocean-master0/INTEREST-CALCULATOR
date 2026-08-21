"""
Interest Calculator - Flask Application
A web application for calculating simple and compound interest.
"""

import math
import os
import time
from collections import defaultdict
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify
from markupsafe import Markup
from flask_wtf.csrf import CSRFProtect, CSRFError
from werkzeug.middleware.proxy_fix import ProxyFix

load_dotenv()

# ============================================================
# Flask-Talisman (optional — only in production)
# ============================================================

try:
    from flask_talisman import Talisman
except ImportError:
    Talisman = None

# ============================================================
# Configuration Constants
# ============================================================

DEFAULT_PORT = 5000
MAX_TIME_YEARS = 1000

# Rate limiting configuration
RATE_LIMIT_REQUESTS = 30  # Maximum requests
RATE_LIMIT_WINDOW = 60    # Per X seconds

# Time unit conversion factors (to years)
TIME_CONVERSIONS = {
    "Years": 1,
    "Months": 1 / 12,
    "Days": 1 / 365,
    "Minutes": 1 / 525600,
    "Seconds": 1 / 31536000
}

# Compounding frequency (times per year)
COMPOUND_FREQUENCIES = {
    "Annually": 1,
    "Semi-Annually": 2,
    "Quarterly": 4,
    "Monthly": 12
}

# ============================================================
# Flask App Setup
# ============================================================

app = Flask(__name__)

# ── Trust proxy headers only as configured ─────────────────
# Only trust X-Forwarded-For / X-Forwarded-Proto from the number of
# reverse proxies actually in front of this app. This prevents a
# client from spoofing its own IP (rate-limit bypass / targeted
# rate-limit DoS on another user). Set TRUSTED_PROXY_COUNT to the
# number of trusted proxies (e.g. 1 on Render, which sits behind a
# single edge proxy). Default is 0 (no proxy trusted, remote_addr used
# as-is) so nothing is trusted unless explicitly configured.
_trusted_proxy_count = int(os.environ.get("TRUSTED_PROXY_COUNT", "0"))
if _trusted_proxy_count > 0:
    app.wsgi_app = ProxyFix(
        app.wsgi_app,
        x_for=_trusted_proxy_count,
        x_proto=_trusted_proxy_count,
        x_host=_trusted_proxy_count,
    )

# ── Debug / Production Mode ─────────────────────────────────
# IMPORTANT: this must NEVER default to True. Debug mode exposes the
# interactive Werkzeug debugger (remote code execution) if the app is
# ever reachable from the network. It is only turned on when
# FLASK_DEBUG=1 is explicitly set — never inferred from a
# platform-specific variable like RENDER, since deploying to any other
# host without setting that variable would silently enable debug mode
# in production.
_debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
_is_production = not _debug_mode

# ── HTTPS Enforcement Gate ─────────────────────────────────
# Talisman (force_https + strict headers) and Secure cookies must only
# activate when TLS is actually terminated in front of the app — i.e.
# on a real deployment (Render sets RENDER) or via explicit opt-in
# (ENABLE_TALISMAN=1). Keying them on _is_production alone would 301
# every local http:// request to a nonexistent https:// endpoint and
# drop session cookies on plain-HTTP LAN testing, breaking CSRF.
_https_enforced = bool(os.environ.get("RENDER")) or os.environ.get("ENABLE_TALISMAN") == "1"

# ── Secret Key ─────────────────────────────────────────────
_secret_key = os.environ.get("SECRET_KEY")
if not _secret_key:
    # Persist a generated key to a file so sessions/tokens survive restarts
    _key_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".secret_key")
    try:
        if os.path.exists(_key_file):
            with open(_key_file, "r") as f:
                _secret_key = f.read().strip()
        if not _secret_key:
            import secrets
            _secret_key = secrets.token_hex(32)
            with open(_key_file, "w") as f:
                f.write(_secret_key)
    except OSError:
        import secrets
        _secret_key = secrets.token_hex(32)
    if _is_production:
        print("WARNING: Using a persisted SECRET_KEY (stored in .secret_key). Set SECRET_KEY env var for production.")
app.config["SECRET_KEY"] = _secret_key

# ── Secure Cookie Configuration ────────────────────────────
app.config["SESSION_COOKIE_SECURE"] = _https_enforced
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

# ── CSRF Protection ───────────────────────────────────────
csrf = CSRFProtect(app)

# ── Security Headers (HTTPS-enforced deployments only) ─────
if _https_enforced and Talisman is not None:
    Talisman(
        app,
        force_https=True,
        force_https_permanent=True,
        strict_transport_security=True,
        strict_transport_security_preload=True,
        strict_transport_security_max_age=31536000,
        frame_options="DENY",
        referrer_policy="strict-origin-when-cross-origin",
        content_security_policy={
            "default-src": "'self'",
            "script-src": [
                "'self'",
                "cdn.jsdelivr.net",
                "cdnjs.cloudflare.com",
            ],
            "style-src": [
                "'self'",
                "'unsafe-inline'",
                "cdn.jsdelivr.net",
                "fonts.googleapis.com",
            ],
            "font-src": [
                "'self'",
                "cdn.jsdelivr.net",
                "fonts.gstatic.com",
            ],
            "img-src": ["'self'", "data:"],
            "media-src": ["'self'", "data:"],
            "connect-src": "'self'",
            "frame-ancestors": "'none'",
            "form-action": "'self'",
        },
        content_security_policy_nonce_in=None,
    )

# ============================================================
# CSRF Error Handler
# ============================================================


@app.errorhandler(CSRFError)
def handle_csrf_error(e):
    """Return a safe, retriable error message when CSRF validation fails."""
    return jsonify({
        "error": "CSRF validation failed",
        "csrf_failed": True
    }), 419


@app.route('/api/csrf-token')
def csrf_token_endpoint():
    """Return a fresh CSRF token (session must exist). Used to recover from expired tokens."""
    from flask_wtf.csrf import generate_csrf
    return jsonify({"csrf_token": generate_csrf()})


# ============================================================
# Helper Functions
# ============================================================


def parse_number(value, field_name: str = "value") -> float:
    """Parse a number string, removing commas. Returns field-specific error on failure."""
    if value is None:
        raise ValueError(f"Please enter a valid {field_name}")
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Please enter a valid {field_name}")
    try:
        return float(value.replace(',', ''))
    except (ValueError, TypeError):
        raise ValueError(f"Please enter a valid {field_name}")


def calculate_simple_interest(principal: float, rate: float, time: float) -> tuple:
    """Calculate simple interest and total amount."""
    interest = (principal * rate * time) / 100
    total = principal + interest
    return interest, total


def calculate_compound_interest(principal: float, rate: float, time: float, frequency: str) -> tuple:
    """Calculate compound interest and total amount."""
    n = COMPOUND_FREQUENCIES[frequency]
    amount = principal * ((1 + (rate / (100 * n))) ** (n * time))
    interest = amount - principal
    return interest, amount


def format_result(interest_type: str, interest: float, total: float) -> str:
    """
    Format the calculation result as HTML.

    Note: This function is safe from XSS as it only uses pre-validated numeric values.
    The interest and total parameters are always floats from calculation functions.
    """
    label = "Simple Interest" if interest_type == "simple" else "Compound Interest"
    # Use Markup to indicate this is safe HTML (values are numeric, not user input)
    return Markup(f"{label}: {interest:,.2f} INR<br>Total Amount: {total:,.2f} INR")


# Simple in-memory rate limiter
rate_limit_store = defaultdict(list)


def is_rate_limited(ip: str) -> bool:
    """Check if an IP address has exceeded the rate limit."""
    current_time = time.time()
    # Clean old entries
    entries = [t for t in rate_limit_store[ip] if current_time - t < RATE_LIMIT_WINDOW]

    if len(entries) >= RATE_LIMIT_REQUESTS:
        rate_limit_store[ip] = entries
        return True

    entries.append(current_time)
    rate_limit_store[ip] = entries

    # Prevent unbounded growth of tracked IPs: opportunistically drop
    # any other IP keys that have gone completely idle.
    if len(rate_limit_store) > 10000:
        for stale_ip in [k for k, v in rate_limit_store.items() if not v]:
            del rate_limit_store[stale_ip]

    return False


def is_finite_number(value: float) -> bool:
    """Return True if value is a real, finite (non-NaN, non-infinite) number."""
    return isinstance(value, (int, float)) and math.isfinite(value)


# ============================================================
# Routes
# ============================================================


@app.route('/')
def index():
    """Serve the main calculator page."""
    return render_template('index.html')


@app.route('/favicon.ico')
def favicon():
    """Serve the favicon."""
    return app.send_static_file('favicon.ico')


@app.route('/sw.js')
def service_worker():
    """Serve the service worker from root path."""
    response = app.send_static_file('service-worker.js')
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


@app.route('/.well-known/appspecific/com.chrome.devtools.json')
def chrome_devtools():
    """Handle Chrome DevTools request."""
    return jsonify({})


@app.route('/calculate_interest', methods=['POST'])
def calculate_interest():
    """
    Calculate interest based on form data.

    Expected form fields:
        - principal: Principal amount
        - rate: Interest rate (% per annum)
        - time: Time period
        - time_unit: Unit of time (Years/Months/Days/Minutes/Seconds)
        - interest_type: Type of interest (simple/compound)
        - frequency: Compounding frequency (for compound interest)
    """
    # Rate limiting check
    # NOTE: request.remote_addr is used directly (never a raw client-supplied
    # header). When behind a real reverse proxy, set TRUSTED_PROXY_COUNT so
    # ProxyFix rewrites remote_addr from a *trusted* X-Forwarded-For hop —
    # trusting the header directly would let a client spoof any IP and
    # bypass the limit, or frame another user for being rate-limited.
    client_ip = request.remote_addr or "unknown"
    if is_rate_limited(client_ip):
        return jsonify({'error': 'Too many requests. Please wait a moment.'}), 429

    try:
        # Parse form data with field-specific validation
        principal = parse_number(request.form.get('principal'), 'amount')
        rate = parse_number(request.form.get('rate'), 'rate')
        time_input = parse_number(request.form.get('time'), 'time period')
        time_unit = request.form.get('time_unit', '')
        interest_type = request.form.get('interest_type', '')
        frequency = request.form.get('frequency', 'Annually')

        if not time_unit:
            return jsonify({'error': 'Please select a time unit.'}), 400
        if not interest_type:
            return jsonify({'error': 'Please select an interest type.'}), 400

        # Validate time_unit and frequency against known values instead of
        # silently defaulting (previously an unknown time_unit silently fell
        # back to "Years", and an unknown frequency raised an unhandled
        # KeyError -> 500 error).
        if time_unit not in TIME_CONVERSIONS:
            return jsonify({'error': 'Please select a valid time unit.'}), 400

        if interest_type == "compound" and frequency not in COMPOUND_FREQUENCIES:
            return jsonify({'error': 'Please select a valid compounding frequency.'}), 400

        # Validate inputs
        if principal < 0 or rate < 0 or time_input < 0:
            return jsonify({'error': 'Negative values are not allowed.'}), 400

        if not (is_finite_number(principal) and is_finite_number(rate) and is_finite_number(time_input)):
            return jsonify({'error': 'Please enter valid, finite numbers.'}), 400

        # Convert time to years, then enforce MAX_TIME_YEARS uniformly for
        # every unit (previously this was only checked for "Years" and
        # "Days", so e.g. a huge value in "Months" or "Seconds" could slip
        # through and blow up the calculation into Infinity).
        time_in_years = time_input * TIME_CONVERSIONS[time_unit]

        if time_in_years > MAX_TIME_YEARS:
            return jsonify({'error': f'Time period is too long (max {MAX_TIME_YEARS} years).'}), 400

        # Calculate interest
        if interest_type == "simple":
            interest, total = calculate_simple_interest(principal, rate, time_in_years)
        elif interest_type == "compound":
            try:
                interest, total = calculate_compound_interest(principal, rate, time_in_years, frequency)
            except OverflowError:
                return jsonify({'error': 'Result too large to calculate.'}), 400
        else:
            return jsonify({'error': 'Please select an interest type.'}), 400

        # Guard against Infinity/NaN results (e.g. from an extreme rate),
        # which Python's json module would otherwise serialize as the
        # non-standard "Infinity"/"NaN" literals and break JSON.parse()
        # on the frontend.
        if not (is_finite_number(interest) and is_finite_number(total)):
            return jsonify({'error': 'Result too large to calculate.'}), 400

        return jsonify({'result': format_result(interest_type, interest, total)})

    except ValueError as e:
        return jsonify({'error': str(e)}), 400


# ============================================================
# Main Entry Point
# ============================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', DEFAULT_PORT))
    app.run(host='0.0.0.0', port=port, debug=not _is_production)