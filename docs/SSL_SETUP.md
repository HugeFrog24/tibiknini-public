# SSL Setup

This document outlines the process for setting up SSL using Cloudflare.

## .dev Domains and HTTPS

All .dev domains are on the HSTS (HTTP Strict Transport Security) preload list. This means:

1. HTTPS is required for all .dev domains.
2. Browsers will always use HTTPS for .dev domains, even if HTTP is specified.
3. This applies to all subdomains as well.

## End-to-End Encryption

We use Cloudflare for end-to-end encryption:

1. Traffic between the user and Cloudflare is encrypted.
2. Traffic between Cloudflare and our origin server is also encrypted.

## Cloudflare Certificate Generation

To set up SSL with Cloudflare:

1. Log into the Cloudflare dashboard.
2. Navigate to **SSL/TLS** > **Origin Server**.
3. Click **"Create Certificate"**.
4. Choose **"RSA (2048)"** for the private key type.
5. Add your domain and any subdomains (e.g., `boger.dev`, `*.boger.dev`).
6. Choose the certificate validity (default is 15 years).
7. Generate the certificate.

## Install the Cloudflare Certificate

After generation:

1. Create a `cloudflare` directory in your project root.
2. Save the Origin Certificate as `cloudflare/cloudflare-origin.pem`.
3. Save the Private Key as `cloudflare/cloudflare-origin.key`.
4. Ensure these files are in your `.gitignore` to keep them secure.

## Nginx Configuration

The Nginx configuration in `nginx/nginx.conf.prod` is set up to use these certificates. Key points:

- SSL is enabled on port 443.
- Certificates are loaded from `/etc/nginx/ssl/`.
- HTTP traffic (port 80) is redirected to HTTPS.
- Modern SSL protocols and ciphers are used.

## Docker Configuration

The `docker-compose.yml` file is configured to:

- Mount the Cloudflare certificates into the Nginx container.
- Expose both port 80 and 443.

## Renewing Certificates

Cloudflare Origin Certificates are valid for 15 years by default. To renew:

1. Generate a new certificate in the Cloudflare dashboard.
2. Replace the existing `.pem` and `.key` files in your `cloudflare` directory.
3. Rebuild and restart your Docker containers.

Remember to keep your SSL certificates secure and never commit them to version control.