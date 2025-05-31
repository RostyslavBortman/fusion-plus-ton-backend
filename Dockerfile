# ---------- build stage ----------
FROM node:22-alpine AS build
WORKDIR /app

RUN npm i -g pnpm

# install deps (cache-friendly layer)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# compile sources → dist/
COPY . .
RUN pnpm run build

# ---------- runtime stage ----------
FROM node:22
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

RUN npm i -g pnpm

# prod-only deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts \
    && pnpm store prune && pnpm cache clean --silent

# compiled output
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["pnpm","start:prod"]