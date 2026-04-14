# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --loglevel verbose 2>&1 | tail -50 || (cat /root/.npm/_logs/*.log 2>/dev/null | tail -100; exit 1)
COPY . .
ENV REACT_APP_API_URL=http://localhost:8080/api/v1
RUN npm run build

# Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
