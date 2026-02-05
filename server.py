"""
Production Server - Waitress WSGI Server
Runs the Flask application using Waitress for production deployment.
"""

import os
from waitress import serve
from app import app

# Default port for the server
DEFAULT_PORT = 5000


def main():
    """Start the production WSGI server."""
    port = int(os.environ.get('PORT', DEFAULT_PORT))
    print(f"Starting production server on http://0.0.0.0:{port}")
    serve(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
