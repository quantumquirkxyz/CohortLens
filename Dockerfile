# syntax=docker/dockerfile:1
# Root Dockerfile for Fly.io autodetection.
#
# Fly's `launch` command needs to see a Dockerfile or a recognized runtime at
# the directory it inspects. The production service images already live under
# `docker/`, but this root Dockerfile makes the repository root launchable.
#
# This image matches the API production build used elsewhere in the repo.

FROM node:22-alpine AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV CI=true
RUN corepack enable

WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json vitest.base.config.ts eslint.config.mjs ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/database/package.json packages/database/
COPY packages/lenses/package.json packages/lenses/
COPY packages/contracts/package.json packages/contracts/
COPY packages/indexer/package.json packages/indexer/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @cohortlens/api build \
  && pnpm --filter @cohortlens/api deploy --prod --legacy /out

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=8000
WORKDIR /app
COPY --from=build /out ./
EXPOSE 8000
CMD ["node", "dist/index.js"]
