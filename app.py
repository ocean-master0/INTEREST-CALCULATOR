import os
from flask import Flask, render_template, request, jsonify, url_for


app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('favicon.ico')

@app.route('/.well-known/appspecific/com.chrome.devtools.json')
def chrome_devtools():
    return jsonify({})

@app.route('/calculate_interest', methods=['POST'])
def calculate_interest():
    try:
        principal = float(request.form['principal'].replace(',', ''))
        rate = float(request.form['rate'].replace(',', ''))
        time_input = float(request.form['time'].replace(',', ''))
        time_unit = request.form['time_unit']
        interest_type = request.form['interest_type']
        frequency = request.form.get('frequency', 'Annually')

        if principal < 0 or rate < 0 or time_input < 0:
            return jsonify({'error': 'Negative values are not allowed.'})
        
        if time_input > 1000 and time_unit == "Years":
             return jsonify({'error': 'Time period is too long (max 1000 years).'})

        time_conversions = {"Years": 1, "Months": 1/12, "Days": 1/365, "Minutes": 1/525600, "Seconds": 1/31536000}
        time = time_input * time_conversions.get(time_unit, 1)

        result = ""
        total_amount = 0

        if interest_type == "simple":
            interest = (principal * rate * time) / 100
            total_amount = principal + interest
            result = f"Simple Interest: {interest:,.2f} INR<br>Total Amount: {total_amount:,.2f} INR"
        elif interest_type == "compound":
            n = {"Annually": 1, "Semi-Annually": 2, "Quarterly": 4, "Monthly": 12}[frequency]
            try:
                amount = principal * ((1 + (rate / (100 * n))) ** (n * time))
            except OverflowError:
                return jsonify({'error': 'Result too large to calculate.'})
            interest = amount - principal
            total_amount = amount
            result = f"Compound Interest: {interest:,.2f} INR<br>Total Amount: {total_amount:,.2f} INR"
        else:
            return jsonify({'error': 'Please select an interest type.'})

        return jsonify({'result': result})

    except ValueError:
        return jsonify({'error': 'Please enter valid numeric values.'})

if __name__ == '__main__':
    # On Render, the PORT env var is set. We should run on 0.0.0.0.
    # We disable debug mode on Render for security.
    is_production = os.environ.get('RENDER') is not None
    port = int(os.environ.get('PORT', 5000))
    
    app.run(host='0.0.0.0', port=port, debug=not is_production)