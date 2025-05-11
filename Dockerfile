# ---------- Builder Stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Package-Files kopieren und Dependencies installieren
COPY package*.json ./
RUN npm ci

# Quellcode kopieren und bauen
COPY . .
RUN npm run build

# ---------- Runtime Stage ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Nur das Nötigste aus dem Builder übernehmen
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production

EXPOSE 3000
CMD ["npm", "start"]
