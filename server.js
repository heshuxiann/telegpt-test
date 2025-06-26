import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// 为了兼容 ES Module 的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// 打印环境变量（你可以传 .env 或 docker run -e 方式）
console.log('TELEGRAM_API_ID:', process.env.TELEGRAM_API_ID);
console.log('TELEGRAM_API_HASH:', process.env.TELEGRAM_API_HASH);

// API 示例：让前端能获取环境变量
app.get('/env', (req, res) => {
  res.json({
    TELEGRAM_API_ID: process.env.TELEGRAM_API_ID,
    TELEGRAM_API_HASH: process.env.TELEGRAM_API_HASH,
  });
});

// 静态资源服务
app.use(express.static(path.join(__dirname, 'dist')));

// SPA 前端支持 history 模式
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
