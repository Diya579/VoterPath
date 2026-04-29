# Simple Dockerfile for serving pre-built frontend and backend
FROM node:18-alpine
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy backend source
COPY backend ./backend

# Copy pre-built frontend
COPY dist ./dist

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "backend/server.js"]
