import os
import sys
import asyncio
from http.client import responses

APP_DIR = os.path.dirname(os.path.abspath(__file__))
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)
os.chdir(APP_DIR)

from app.main import app

def application(environ, start_response):
    status_code = [200]
    response_headers = []
    body_parts = []

    # Build ASGI scope from WSGI environ
    headers = []
    for k, v in environ.items():
        if k.startswith('HTTP_'):
            headers.append((k[5:].lower().replace('_', '-').encode('latin1'), str(v).encode('latin1')))
        elif k in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
            if v:
                headers.append((k.lower().replace('_', '-').encode('latin1'), str(v).encode('latin1')))

    path = environ.get('PATH_INFO', '/')
    scope = {
        'type': 'http',
        'asgi': {'version': '3.0', 'spec_version': '2.1'},
        'http_version': environ.get('SERVER_PROTOCOL', 'HTTP/1.1').replace('HTTP/', ''),
        'method': environ.get('REQUEST_METHOD', 'GET'),
        'scheme': environ.get('wsgi.url_scheme', 'https'),
        'path': path,
        'raw_path': path.encode('latin1'),
        'query_string': environ.get('QUERY_STRING', '').encode('latin1'),
        'headers': headers,
        'server': (environ.get('SERVER_NAME', 'api.nillsmart.com'), int(environ.get('SERVER_PORT', 443))),
    }

    body_input = environ.get('wsgi.input')
    content_len = int(environ.get('CONTENT_LENGTH', 0) or 0)
    body_bytes = body_input.read(content_len) if (body_input and content_len > 0) else b''
    body_sent = False

    async def receive():
        nonlocal body_sent
        if not body_sent:
            body_sent = True
            return {'type': 'http.request', 'body': body_bytes, 'more_body': False}
        return {'type': 'http.disconnect'}

    async def send(message):
        if message['type'] == 'http.response.start':
            status_code[0] = message['status']
            for name, value in message.get('headers', []):
                response_headers.append((name.decode('latin1'), value.decode('latin1')))
        elif message['type'] == 'http.response.body':
            body_parts.append(message.get('body', b''))

    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(app(scope, receive, send))
        loop.close()
    except Exception as e:
        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
        return [f"Server Execution Error: {e}".encode('utf-8')]

    code = status_code[0]
    phrase = responses.get(code, 'OK')
    start_response(f"{code} {phrase}", response_headers)
    return body_parts
