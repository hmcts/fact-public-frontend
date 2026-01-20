# ---- Base image ----
FROM hmctspublic.azurecr.io/base/node:22-alpine as base
COPY --chown=hmcts:hmcts . .
USER root
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
RUN corepack enable
WORKDIR /opt/app
USER hmcts

# ---- Build image ----
FROM base as build
RUN yarn install && yarn build:prod

# ---- Runtime image ----
FROM build as runtime
RUN rm -rf webpack/ webpack.config.js
EXPOSE 3344
