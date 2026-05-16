# ===== Stage 1: build =====
FROM node:20-alpine AS builder
WORKDIR /build

# Copy package files trước để cache npm install layer
# Chỉ rebuild deps khi package.json/lock đổi, không phải mọi source change
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ===== Stage 2: nginx runtime =====
FROM nginx:1.27-alpine

# Xoá default config + thay bằng custom (SPA fallback + /api proxy)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /build/dist /usr/share/nginx/html

# nginx user already non-root in official image (nginx:nginx)
# Image này expose 80 và chạy bằng nginx user mặc định

EXPOSE 80

# nginx foreground để Docker lifecycle hoạt động đúng
CMD ["nginx", "-g", "daemon off;"]
