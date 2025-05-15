# ---------- Builder Stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

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

# Scan durchführen und Ergebnis speichern
RUN trivy fs /scan/app --severity CRITICAL,HIGH --exit-code 1 --output /scan/scan_report.txt

# ---------- Runtime Stage ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Nur das Nötigste aus dem Builder übernehmen
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production

# Scan-Report hinzufügen (optional, um bei der Laufzeit den Scanbericht einzusehen)
COPY --from=security-scan /scan/scan_report.txt ./scan_report.txt

EXPOSE 3000

# Startbefehl
CMD ["npm", "start"]
