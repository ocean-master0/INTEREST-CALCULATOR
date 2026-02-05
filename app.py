"""
Interest Calculator - Flask Application
A web application for calculating simple and compound interest.
"""

import os
from flask import Flask, render_template, request, jsonify

# ============================================================
# Configuration Constants
# ============================================================

DEFAULT_PORT = 5000
MAX_TIME_YEARS = 1000

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

# ============================================================
# Helper Functions
# ============================================================

def parse_number(value: str) -> float:
    """Parse a number string, removing commas."""
    return float(value.replace(',', ''))


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
    """Format the calculation result as HTML."""
    label = "Simple Interest" if interest_type == "simple" else "Compound Interest"
    return f"{label}: {interest:,.2f} INR<br>Total Amount: {total:,.2f} INR"


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
    try:
        # Parse form data
        principal = parse_number(request.form['principal'])
        rate = parse_number(request.form['rate'])
        time_input = parse_number(request.form['time'])
        time_unit = request.form['time_unit']
        interest_type = request.form['interest_type']
        frequency = request.form.get('frequency', 'Annually')

        # Validate inputs
        if principal < 0 or rate < 0 or time_input < 0:
            return jsonify({'error': 'Negative values are not allowed.'})

        if time_input > MAX_TIME_YEARS and time_unit == "Years":
            return jsonify({'error': f'Time period is too long (max {MAX_TIME_YEARS} years).'})

        # Convert time to years
        time_in_years = time_input * TIME_CONVERSIONS.get(time_unit, 1)

        # Calculate interest
        if interest_type == "simple":
            interest, total = calculate_simple_interest(principal, rate, time_in_years)
        elif interest_type == "compound":
            try:
                interest, total = calculate_compound_interest(principal, rate, time_in_years, frequency)
            except OverflowError:
                return jsonify({'error': 'Result too large to calculate.'})
        else:
            return jsonify({'error': 'Please select an interest type.'})

        return jsonify({'result': format_result(interest_type, interest, total)})

    except ValueError:
        return jsonify({'error': 'Please enter valid numeric values.'})
    except KeyError as e:
        return jsonify({'error': f'Missing required field: {e}'})


# ============================================================
# Main Entry Point
# ============================================================

if __name__ == '__main__':
    is_production = os.environ.get('RENDER') is not None
    port = int(os.environ.get('PORT', DEFAULT_PORT))
    
    app.run(host='0.0.0.0', port=port, debug=not is_production)