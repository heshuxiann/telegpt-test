FROM node:20-alpine

ENV TELEGRAM_API_ID=29547651
ENV TELEGRAM_API_HASH=6a66d08513c1a86a70be2658edfae544
ENV BASE_URL=https://web.telegram.org/a/
ENV OPEN_API_KEY=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
ENV ALIBABA_CLOUD_ACCESS_KEY_ID=LTAI5t5otr95Wi9gwHijkjpF
ENV ALIBABA_CLOUD_ACCESS_KEY_SECRET=ZuxxPNN36VTPviNbe9GUWuBqsrDVzv
ENV GOOGLE_APP_CLIENT_ID=166854276552-euk0006iphou9bvqplmgmpc0vde8v1in.apps.googleusercontent.com

WORKDIR /app

COPY package*.json ./
COPY dev/eslint-multitab/package*.json dev/eslint-multitab/

RUN apk add --no-cache python3 make g++ git bash

RUN npm ci

COPY . .

RUN npm run build:production

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
