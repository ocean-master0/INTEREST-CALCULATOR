import os
from flask import Flask, render_template, request, jsonify, url_for
import random

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate_interest', methods=['POST'])
def calculate_interest():
    try:
        principal = float(request.form['principal'])
        rate = float(request.form['rate'])
        time_input = float(request.form['time'])
        time_unit = request.form['time_unit']
        interest_type = request.form['interest_type']
        frequency = request.form.get('frequency', 'Annually')

        if principal < 0 or rate < 0 or time_input < 0:
            return jsonify({'error': 'Please enter non-negative values.'})

        time_conversions = {"Years": 1, "Months": 1/12, "Days": 1/365, "Minutes": 1/525600, "Seconds": 1/31536000}
        time = time_input * time_conversions.get(time_unit, 1)

        if interest_type == "simple":
            interest = (principal * rate * time) / 100
            total_amount = principal + interest
            result = f"Simple Interest: {interest:.2f} INR<br>Total Amount: {total_amount:.2f} INR"
        elif interest_type == "compound":
            n = {"Annually": 1, "Semi-Annually": 2, "Quarterly": 4, "Monthly": 12}[frequency]
            amount = principal * ((1 + (rate / (100 * n))) ** (n * time))
            interest = amount - principal
            total_amount = amount
            result = f"Compound Interest: {interest:.2f} INR<br>Total Amount: {total_amount:.2f} INR"
        else:
            return jsonify({'error': 'Please select an interest type.'})

        fortunes = [
            f"With this, you could buy {int(total_amount / 100)} cups of coffee in {time_input} {time_unit.lower()}!",
            f"In {time_input} {time_unit.lower()}, this could fund {int(total_amount / 5000)} movie nights!",
            f"This interest could get you {int(total_amount / 2000)} pizzas over time!"
        ]
        fortune = random.choice(fortunes)

        badges = ["Smart Saver", "Interest Guru", "Money Wizard", "Future Tycoon"]
        badge = random.choice(badges)

        share_link = url_for('index', _external=True) + f"?principal={principal}&rate={rate}&time={time_input}&unit={time_unit}&type={interest_type}&freq={frequency}"
        return jsonify({'result': result, 'share_link': share_link, 'fortune': fortune, 'badge': badge})

    except ValueError:
        return jsonify({'error': 'Please enter valid numeric values.'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)