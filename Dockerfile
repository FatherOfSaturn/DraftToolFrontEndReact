# Stage 1: Build the React application
# CHANGED: build natively on the CI runner's architecture, so npm ci and the
# Vite build never run under slow ARM emulation. The output is plain static
# files, which are identical for every CPU type.
FROM --platform=$BUILDPLATFORM node:26-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/api
ARG VITE_USE_MOCK_API=false
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_SKIP_AUTH=false
ARG VITE_TURNSTILE_SITE_KEY=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_USE_MOCK_API=$VITE_USE_MOCK_API
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_SKIP_AUTH=$VITE_SKIP_AUTH
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY

RUN npm run build

# Stage 2: Serve the app with Nginx
# Built once per target architecture (amd64 and arm64).
FROM nginx:1.31-alpine

COPY --from=build /usr/src/app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
