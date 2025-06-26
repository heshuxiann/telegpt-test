FROM node:20-alpine

ARG OPEN_API_KEY
ARG TELEGRAM_API_HASH
ARG TELEGRAM_API_ID

ENV OPEN_API_KEY=$OPEN_API_KEY
ENV TELEGRAM_API_HASH=$TELEGRAM_API_HASH
ENV TELEGRAM_API_ID=$TELEGRAM_API_ID

WORKDIR /app

COPY package*.json ./
COPY dev/eslint-multitab/package*.json dev/eslint-multitab/

RUN apk add --no-cache python3 make g++ git bash

RUN npm ci

COPY . .

RUN npm run build:production

# RUN npm install -g serve

# EXPOSE 3000

# CMD ["serve", "-s", "dist", "-l", "3000"]

# 启动 Node.js 后端服务（express）
EXPOSE 3000

CMD ["node", "server.js"]
