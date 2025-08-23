#!/bin/sh
set -e

# Check if recaptcha_site_key secret exists
if [ -f "/run/secrets/recaptcha_site_key" ]; then
  # Extract the value from the .env file format
  SITE_KEY=$(grep "VITE_RECAPTCHA_SITE_KEY" /run/secrets/recaptcha_site_key | cut -d '=' -f 2)
  # Export it as RECAPTCHA_SITE_KEY for the application
  export RECAPTCHA_SITE_KEY="$SITE_KEY"
  echo "RECAPTCHA_SITE_KEY set from secret"
else
  echo "Warning: recaptcha_site_key secret not found"
fi

# Execute the original command
exec "$@"