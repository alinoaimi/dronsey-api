# Build Stage
FROM node:22-alpine AS builder

WORKDIR /app



# Copy package files
COPY package*.json ./

# Install dependencies (frozen-lockfile for consistency)
RUN npm install

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Production Stage
FROM node:22-alpine

WORKDIR /app



# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 8000

# Start command
CMD ["npm", "start"]
