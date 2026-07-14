# Stage 1: Build the SPA
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the SPA with Nginx
FROM nginx:alpine

# Copy built assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx config overriding default server blocks to run on port 5173
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
