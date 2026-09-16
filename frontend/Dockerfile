# STYLIO frontend — build-time image
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ARG VITE_API_BASE=/api
ARG VITE_ML_BASE=/api/ml
ARG VITE_STRIPE_PUBLISHABLE_KEY=
ENV VITE_API_BASE=$VITE_API_BASE \
    VITE_ML_BASE=$VITE_ML_BASE \
    VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
RUN npm run build

# ── Serve static bundle with nginx ─────────────────────────────────────────────
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]