FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY server ./server

EXPOSE 8787

CMD ["node", "server/index.js"]

