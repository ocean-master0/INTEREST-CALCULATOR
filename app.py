"""
Interest Calculator - Flask Application
A web application for calculating simple and compound interest.
"""

import os
import time
from collections import defaultdict
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify
from markupsafe import Markup
from flask_wtf.csrf import CSRFProtect, CSRFError

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

# ── Secret Key ─────────────────────────────────────────────
_secret_key = os.environ.get("SECRET_KEY")
if not _secret_key:
    import secrets
    _secret_key = secrets.token_hex(32)
    if not os.environ.get("RENDER"):
        print("WARNING: Using a random SECRET_KEY. Set SECRET_KEY env var for persistence.")
app.config["SECRET_KEY"] = _secret_key

# ── Secure Cookie Configuration ────────────────────────────
_is_production = bool(os.environ.get("RENDER"))
app.config["SESSION_COOKIE_SECURE"] = _is_production
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

# ── CSRF Protection ───────────────────────────────────────
csrf = CSRFProtect(app)

# ── Security Headers (production only) ────────────────────
if _is_production and Talisman is not None:
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
    """Return a safe error message when CSRF validation fails."""
    return jsonify({"error": "CSRF validation failed. Please refresh the page and try again."}), 400


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
    rate_limit_store[ip] = [t for t in rate_limit_store[ip] if current_time - t < RATE_LIMIT_WINDOW]

    if len(rate_limit_store[ip]) >= RATE_LIMIT_REQUESTS:
        return True

    rate_limit_store[ip].append(current_time)
    return False


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
    return app.send_static_file('service-worker.js')


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
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
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

        # Validate inputs
        if principal < 0 or rate < 0 or time_input < 0:
            return jsonify({'error': 'Negative values are not allowed.'}), 400

        if time_input > MAX_TIME_YEARS and time_unit == "Years":
            return jsonify({'error': f'Time period is too long (max {MAX_TIME_YEARS} years).'}), 400

        if time_unit == "Days" and time_input > 365000:
            return jsonify({'error': 'Date range too large (max ~1000 years).'}), 400

        # Convert time to years
        time_in_years = time_input * TIME_CONVERSIONS.get(time_unit, 1)

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

        return jsonify({'result': format_result(interest_type, interest, total)})

    except ValueError as e:
        return jsonify({'error': str(e)}), 400


# ============================================================
# Main Entry Point
# ============================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', DEFAULT_PORT))
    app.run(host='0.0.0.0', port=port, debug=not _is_production)