import sys
import os

# Add application directory to python path
sys.path.insert(0, os.path.dirname(__file__))

from a2wsgi import WSGIMiddleware
from app.main import app

# cPanel Phusion Passenger WSGI Entrypoint
application = WSGIMiddleware(app)
