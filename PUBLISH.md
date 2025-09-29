# 1. 构建应用
electron:release:production

# 2. 生成 latest-mac.yml
npm run electron:generate-latest

# 3. 发布到 GitHub
npm run electron:publish