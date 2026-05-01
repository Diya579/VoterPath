# Multi-stage Dockerfile: Build frontend, then serve via Node.js backend
# Stage 1: Build the React frontend
FROM node:20-alpine AS builder
WORKDIR /app

# Copy frontend package files and install ALL dependencies (including devDeps for build)
COPY package*.json ./
RUN npm ci

# Copy frontend source and build
COPY . .
RUN npm run build

# Stage 2: Production server — minimal image, no build tools
FROM node:20-alpine AS production
WORKDIR /app

# Install backend dependencies only
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy backend source
COPY backend ./backend

# Copy compiled frontend from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "backend/server.js"]
