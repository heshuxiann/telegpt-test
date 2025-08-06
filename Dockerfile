FROM node:20-alpine

ENV TELEGRAM_API_ID=29547651
ENV TELEGRAM_API_HASH=6a66d08513c1a86a70be2658edfae544
ENV BASE_URL=https://app.telegpt.org
ENV OPEN_API_KEY=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
ENV ALIBABA_CLOUD_ACCESS_KEY_ID=LTAI5t5otr95Wi9gwHijkjpF
ENV ALIBABA_CLOUD_ACCESS_KEY_SECRET=ZuxxPNN36VTPviNbe9GUWuBqsrDVzv
ENV GOOGLE_APP_CLIENT_ID=166854276552-euk0006iphou9bvqplmgmpc0vde8v1in.apps.googleusercontent.com

# 安装 tini 作为 PID 1 管理器 + 基本依赖
RUN apk add --no-cache python3 make g++ git bash tini

# 设置环境变量（推荐通过外部传入，而不是写死）
ENV PORT=3000

# 配置工作目录
WORKDIR /app

# 拷贝依赖定义文件
COPY package*.json ./
COPY dev/eslint-multitab/package*.json dev/eslint-multitab/

# 安装依赖
RUN npm ci

# 拷贝项目源代码
COPY . .

# 构建生产文件
RUN npm run build:production

# 安装 serve 作为静态文件服务器
RUN npm install -g serve

# 使用 tini 启动主进程
ENTRYPOINT ["/sbin/tini", "--"]

# 默认执行 serve
CMD ["serve", "-s", "dist", "-l", "3000", "--no-clipboard"]

# 暴露服务端口
EXPOSE 3000

# 健康检查（30s 一次）
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

