FROM python:3.12-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt && useradd -r -m -u 10001 grant
COPY backend /app/backend
COPY site/data /app/site/data
RUN chown -R grant:grant /app
USER grant
EXPOSE 8000
CMD ["sh","-c","python -m backend.bootstrap && exec uvicorn backend.api:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers"]
