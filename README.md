# 📱 Advanced Premium Calculator & Interest Analyzer

A sophisticated, mobile-first web application enabling users to calculate Simple & Compound Interest with precision, alongside a fully fictional standard calculator. Built with a focus on premium UI/UX, offline capabilities (PWA), and robust mathematical logic.

![Premium UI](static/images/icon-512x512.png)

## ✨ Key Features

### 🏦 Interest Calculator
*   **Dual Modes**: Switch seamlessly between **Simple Interest** and **Compound Interest**.
*   **Flexible Time Units**: Calculate based on Years, Months, Days, Minutes, or even Seconds.
*   **Compounding Frequencies**: Support for Annual, Semi-annual, Quarterly, and Monthly compounding.
*   **Real-time Formatting**: Inputs automatically format with commas (e.g., `1,00,000`) for better readability (Indian Numbering System).
*   **Smart Validation**: Prevents negative inputs and visualizes calculation progress.
*   **Share Results**: Generate proper text summaries of calculations and share them via native mobile sharing or clipboard.

### 🧮 Standard Calculator
*   **Live Preview**: "Typing Mode" shows the equation large and the result small.
*   **Focus Mode**: Hitting `=` shifts focus to the result while keeping the history visible.
*   **Smart Logic**: 
    *   Handles complex operations (e.g., `-22 * 0`).
    *   Prevents syntax errors (e.g., multiple decimal points `5.5.5`).
    *   Auto-replaces operators when switching (e.g., type `+` then `-`, it becomes `-`).
*   **Backspace**: Dedicated backspace button for easy correction.

### 🎨 Premium UI/UX
*   **Mobile-First Design**: Optimized for touch inputs with large, tactile buttons.
*   **Glassmorphism**: Modern, clean aesthetics with soft shadows and gradients.
*   **Adaptive Layout**: Responsive design that looks great on mobile and desktop.
*   **Animations**: Smooth transitions for tabs, results, and button presses.

### ⚡ PWA (Progressive Web App)
*   **Installable**: Can be installed on mobile devices as a native app.
*   **Offline Support**: Works without an internet connection using Service Workers.
*   **App Icons**: Custom generated adaptive icons.

## 🛠️ Technology Stack

*   **Backend**: Python (Flask)
*   **Frontend**: HTML5, CSS3 (Custom Properties), JavaScript (ES6+)
*   **PWA**: Web App Manifest, Service Workers
*   **No External CSS/JS Frameworks**: Pure, lightweight code for maximum performance.

## 🚀 Setup & Installation

1.  **Clone or Download** the repository.
2.  **Install Python** (if not already installed).
3.  **Install Dependencies**:
    ```bash
    pip install flask
    ```
4.  **Run the Application**:
    ```bash
    python app.py
    ```
5.  **Open in Browser**:
    *   Local: `http://127.0.0.1:5000`
    *   Network (Mobile): `http://<YOUR_IP>:5000`

## ☁️ Deployment (Render)

This project is fully configured for deployment on [Render](https://render.com).

### Option 1: Automatic Deployment (Recommended)
1.  Push this code to a **GitHub** or **GitLab** repository.
2.  Log in to dashboard.render.com.
3.  Click **New +** -> **Web Service**.
4.  Connect your repository.
5.  Render will automatically detect the `render.yaml` or `Procfile` and configure the build/start commands.
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `gunicorn app:app`
6.  Click **Deploy**.

### Configuration Files
*   `Procfile`: Specifies the start command (`gunicorn app:app`).
*   `requirements.txt`: Lists dependencies (`flask`, `gunicorn`).
*   `render.yaml`: (Optional) Blueprint for Infrastructure as Code.

## 📂 Project Structure

```
interest_calculator/
├── app.py              # Flask Backend Routes & Logic
├── templates/
│   └── index.html      # Main Application UI
├── static/
│   ├── css/
│   │   └── styles.css  # Premium Styling & Themes
│   ├── js/
│   │   └── scripts.js  # Calculator Logic & Interactions
│   ├── images/         # Icons & Assets
│   ├── manifest.json   # PWA Configuration
│   └── service-worker.js # Offline Caching Logic
└── README.md           # Documentation
```

## 🔒 Security & Logic Improvements

*   **Input Sanitization**: Backend strictly validates numeric inputs to prevent errors.
*   **Overflow Protection**: Limits calculation periods (e.g., max 1000 years) to prevent server hangs.
*   **Safe Evaluation**: Standard calculator uses a sanitized `Function` constructor instead of `eval()` to prevent code injection while allowing complex math.

---
*Created with ❤️ for a premium calculation experience.*
