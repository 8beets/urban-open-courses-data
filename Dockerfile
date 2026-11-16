FROM node:26-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
# The repository is mounted here, so CSV and output paths are relative to its root.
WORKDIR /data
ENTRYPOINT ["node", "/app/src/cli.ts"]
