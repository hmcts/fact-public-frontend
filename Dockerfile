# ---- Build assets and production dependencies ----
FROM hmctsprod.azurecr.io/base/node:22-alpine@sha256:fec7a28bb5228829fd60f8623557cacbe3a1f843f421b95e16ec075e70bf6d49 AS build
COPY --chown=hmcts:hmcts . .
RUN rm -rf src/main/public src/main/views/govuk \
    && PUPPETEER_SKIP_DOWNLOAD=true yarn install --immutable \
    && yarn build:prod \
    && yarn workspaces focus --production \
    && rm -rf src/main/assets src/main/bundles src/main/resources

# ---- Runtime image ----
FROM hmctsprod.azurecr.io/base/node:22-alpine@sha256:fec7a28bb5228829fd60f8623557cacbe3a1f843f421b95e16ec075e70bf6d49 AS runtime
COPY --from=build /opt/app/node_modules ./node_modules
COPY --from=build /opt/app/tsconfig.json ./
COPY --from=build /opt/app/config ./config
COPY --from=build /opt/app/src/main ./src/main
ENV NODE_ENV=production
USER hmcts
EXPOSE 3344
CMD ["./node_modules/.bin/ts-node", "--transpile-only", "src/main/server.ts"]
