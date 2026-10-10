#!/bin/sh
set -eu

# Azure App Service (Linux) startup for the Django app.
# The React SPA is prebuilt into ./spa by CI, so Django serves it same-origin.

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${GUNICORN_WORKERS:-2}" \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
