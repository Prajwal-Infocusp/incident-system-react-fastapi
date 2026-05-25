# Build Stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx template configuration
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Default env variables for local production running (can be overridden at runtime)
ENV PORT=5173
ENV BACKEND_URL=http://backend:8000
EXPOSE 5173

# Substitute env variables at runtime and start Nginx
CMD ["/bin/sh", "-c", "envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
