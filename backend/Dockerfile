FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Installed before the source so dependency layers stay cached across code edits.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Uploaded media lives here; mount a volume over it to survive redeploys.
RUN mkdir -p uploads && chown -R nobody:nogroup /app
USER nobody

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/').status==200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
