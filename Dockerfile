# ---- Build assets and production dependencies ----
FROM hmctsprod.azurecr.io/base/node:24-alpine@sha256:a727a2b7d510a6ac7dae811b2e235c54d3485080e61cf77c2a92927a1c0b4a9b AS build
COPY --chown=hmcts:hmcts . .
RUN rm -rf src/main/public src/main/views/govuk \
    && PUPPETEER_SKIP_DOWNLOAD=true yarn install --immutable \
    && yarn build:prod \
    && yarn workspaces focus --production \
    && rm -rf src/main/assets src/main/bundles src/main/resources

# ---- Runtime image ----
FROM hmctsprod.azurecr.io/base/node:24-alpine@sha256:a727a2b7d510a6ac7dae811b2e235c54d3485080e61cf77c2a92927a1c0b4a9b AS runtime
COPY --from=build /opt/app/node_modules ./node_modules
COPY --from=build /opt/app/tsconfig.json ./
COPY --from=build /opt/app/config ./config
COPY --from=build /opt/app/src/main ./src/main
ENV NODE_ENV=production
USER hmcts
EXPOSE 3344
CMD ["./node_modules/.bin/ts-node", "--transpile-only", "src/main/server.ts"]
