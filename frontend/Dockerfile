# ---------- Builder Stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Add labels
LABEL maintainer="Your Name <your.email@example.com>"
LABEL description="Frontend application with security scanning"

# Package-Files kopieren und Dependencies installieren
COPY frontend/package*.json ./
RUN npm ci

# Quellcode kopieren und bauen
COPY frontend/ .
RUN npm run build

# ---------- Security Scan Stage ----------
FROM aquasec/trivy:latest AS security-scan
WORKDIR /scan

# Kopiere das gesamte Build-Verzeichnis für den Scan
COPY --from=builder /app /scan/app

# Scan durchführen und Ergebnis speichern (mit Fehlerbehandlung)
RUN trivy fs /scan/app --severity CRITICAL,HIGH --exit-code 0 --output /scan/scan_report.txt || echo "Security scan completed with findings"

# ---------- Runtime Stage ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Nur das Nötigste aus dem Builder übernehmen
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production

# Scan-Report hinzufügen
COPY --from=security-scan /scan/scan_report.txt ./scan_report.txt

# Set proper permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Startbefehl
CMD ["npm", "start"]
