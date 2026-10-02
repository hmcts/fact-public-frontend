# node:22.23.2-bookworm
FROM node@sha256:a723b54c35a76e947095a20a67d39585bb09c862e6b1adeb8a9f518f95e34fb0

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    sudo \
    ca-certificates \
  && npx playwright install-deps \
  && rm -rf /var/lib/apt/lists/* \
  && echo "node ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/node \
  && chmod 0440 /etc/sudoers.d/node \
  && corepack enable \
  && npm install --global @github/copilot

USER node
