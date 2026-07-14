FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install to ensure local configurations align)
RUN npm install

# Copy application source code
COPY . .

# Expose the API port
EXPOSE 8001

# Default start command (can be overridden in docker-compose)
CMD ["npm", "run", "start"]
