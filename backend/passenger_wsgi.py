"""cPanel / Phusion Passenger entrypoint.

Passenger speaks WSGI. FastAPI is ASGI. a2wsgi names its adapters after what
they *produce*, not what they consume:

    WSGIMiddleware(wsgi_app) -> ASGI app     (wrong way round for Passenger)
    ASGIMiddleware(asgi_app) -> WSGI app     (what Passenger needs)

Note that the ASGI lifespan protocol does not run under this bridge, so the
`create_all` in app.main's lifespan never fires here. Tables are created by
running scripts/seed_catalog.py and scripts/create_admin_auto.py once over SSH
after deploying -- see DEPLOY_NAMECHEAP.md.
"""

import os
import sys

APP_DIR = os.path.dirname(os.path.abspath(__file__))

# Passenger does not guarantee the working directory, and settings read a
# relative `.env` while UPLOAD_DIR is relative too.
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)
os.chdir(APP_DIR)

from a2wsgi import ASGIMiddleware  # noqa: E402

from app.main import app  # noqa: E402

application = ASGIMiddleware(app)
