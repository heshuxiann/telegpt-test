# Agent Chat 系统更新说明

## 更新内容

已完成对 Agent Chat 系统的重构，使用项目封装的 API 并支持 Vercel AI SDK 格式的流式响应。

## 主要更改

### 1. 新增流式 API（chat-api.ts）

添加了 `chatWithGptStream` 函数：

```typescript
export async function chatWithGptStream(
  data: Omit<ChatWithAiProps, 'streaming'> & { streaming?: true },
): Promise<ReadableStream<Uint8Array>>
```

**功能：**
- 使用项目的认证机制（`getApihHeaders`）
- 自动获取和存储 deviceId
- 返回 ReadableStream 用于流式处理
- 与现有 `TelegptFetch` 保持一致的认证方式

### 2. 更新 useAgentChat Hook

**主要改动：**
- 使用 `chatWithGptStream` 替代直接 fetch
- 移除了手动构建 headers 的逻辑
- 使用 Teact 的 hooks（`useCallback`, `useState` 等）
- 修复 TypeScript 兼容性问题（`findLastIndex`）

**API 参数：**
```typescript
const stream = await chatWithGptStream({
  messages: [...],           // 消息列表
  creditCode: 1,            // 计费代码
  contextData: {
    chatId,                 // 聊天 ID
  },
  options: {
    showThinking,           // 是否显示思考过程
    showToolCalls,          // 是否显示工具调用
    detailedCitations,      // 是否返回详细引用
  },
});
```

### 3. Stream Parser 兼容 Vercel AI SDK 格式

添加了对 Vercel AI SDK 流式格式的支持：

**支持的格式：**
- `0:"text"` - 文本内容
- `d:{...}` - 完成事件
- `e:{...}` - 错误/其他事件
- `f:{...}` - 元数据

**处理逻辑：**
```typescript
// 自动检测格式
if (this.isVercelAIFormat(line)) {
  this.handleVercelAILine(line);
} else {
  // 使用新的 Agent 事件流格式
  this.dispatchEvent(JSON.parse(line));
}
```

## 工作流程

```
用户输入
    ↓
useAgentChat.append()
    ↓
chatWithGptStream({
  messages: [...],
  creditCode: 1,
  contextData: { chatId },
  options: { ... }
})
    ↓
使用 getApihHeaders() 认证
    ↓
POST ${SERVER_API_URL}/chat
    ↓
返回 ReadableStream
    ↓
AgentStreamParser 解析
    ↓
自动检测格式：
  - Vercel AI SDK: 0:"text", d:{...}
  - Agent 格式: {"type":"text",...}
    ↓
更新 UI（文本、状态、工具调用）
```

## 测试要点

### 1. 基础对话
```typescript
const { messages, append, status } = useAgentChat({
  chatId: '123',
  showToolCalls: true,
});

// 发送消息
await append({
  role: 'user',
  content: '你好',
  id: uuidv4(),
  createdAt: new Date(),
});
```

**预期结果：**
- ✅ 显示流式文本响应
- ✅ status 从 'ready' → 'streaming' → 'ready'
- ✅ messages 列表正确更新

### 2. Vercel AI SDK 格式响应

**服务端返回：**
```
f:{"messageId":"msg-123"}
0:"当然，没问题！\n\n"
0:"为什么书店里总是那么安静？\n\n"
0:"因为大家都在"阅读"空气！"
e:{"finishReason":"stop","usage":{...}}
d:{"finishReason":"stop","usage":{...}}
```

**前端处理：**
- ✅ 自动识别格式
- ✅ 解析文本内容（`0:"text"`）
- ✅ 处理完成事件（`d:{...}`）
- ✅ 忽略元数据（`f:{...}`）
- ✅ 无解析错误

### 3. Agent 格式响应（未来）

**服务端返回：**
```json
{"type":"phase_change","phase":"thinking","data":{...}}
{"type":"tool_start","phase":"tool_calling","data":{...}}
{"type":"text","phase":"generating","data":{"content":"..."}}
{"type":"done","phase":"completed","data":{...}}
```

**前端处理：**
- ✅ 显示阶段指示器
- ✅ 显示工具调用卡片
- ✅ 流式文本更新
- ✅ 完成回调触发

## 认证流程

使用项目统一的认证机制：

```typescript
// 1. 生成认证 key
function generateKey(userId: string) {
  const timestamp = Date.now();
  const raw = `${userId}:${timestamp}`;
  const signature = CryptoJS.HmacSHA256(raw, SECRET).toString(CryptoJS.enc.Hex);
  return `${userId}:${timestamp}:${signature}`;
}

// 2. 构建 headers
const headers = {
  'Content-Type': 'application/json',
  'platform': 'web',
  'version': '1.0.0',
  'x-auth-key': generateKey(userId),
  'user-name': encodeURIComponent(userName),
};

// 3. 发送请求
fetch(`${SERVER_API_URL}/chat`, { method: 'POST', headers, body });
```

## 配置项

### chatWithGptStream 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| messages | Array<{role, content}> | ✅ | 对话历史 |
| creditCode | number | ✅ | 计费代码（默认 1） |
| contextData | object | ❌ | 上下文数据 |
| contextData.chatId | string | ❌ | 当前聊天 ID |
| options | object | ❌ | Agent 选项 |
| options.showThinking | boolean | ❌ | 是否显示思考过程 |
| options.showToolCalls | boolean | ❌ | 是否显示工具调用 |
| options.detailedCitations | boolean | ❌ | 是否返回详细引用 |

### useAgentChat 配置

```typescript
useAgentChat({
  chatId: string,              // 必需：聊天 ID
  showThinking: false,         // 可选：显示思考过程
  showToolCalls: true,         // 可选：显示工具调用
  detailedCitations: true,     // 可选：详细引用
  onError: (error) => {},      // 可选：错误回调
  onFinish: (result) => {},    // 可选：完成回调
});
```

## 错误处理

### 1. 网络错误
```typescript
try {
  const stream = await chatWithGptStream({...});
} catch (error) {
  // HTTP 错误、网络超时等
  onError?.(error);
  setStatus('error');
}
```

### 2. 解析错误
```typescript
// Vercel AI SDK 格式解析失败
catch (error) {
  console.error('[AgentStreamParser] Failed to parse:', line, error);
  // 不中断流程，继续处理下一行
}
```

### 3. 用户中断
```typescript
// 调用 stop() 函数
abortController.abort();
// 捕获 AbortError，清理状态
```

## 兼容性

- ✅ 支持 Vercel AI SDK 格式（当前服务端）
- ✅ 支持新的 Agent 事件流格式（未来）
- ✅ 自动检测和切换格式
- ✅ 向后兼容现有 API

## 性能优化

1. **流式处理**：使用 ReadableStream，边接收边解析
2. **增量更新**：只更新变化的消息内容
3. **缓冲管理**：处理不完整的行，避免解析错误
4. **内存清理**：及时清理 AbortController 和 Parser 实例

## 待办事项

- [ ] 从全局配置中获取 creditCode
- [ ] 实现引用点击跳转功能
- [ ] 添加思考过程展示 UI
- [ ] 添加重试机制
- [ ] 添加请求超时处理
- [ ] 完善错误提示信息

## 总结

✅ **已完成：**
- 使用项目封装的 API
- 支持 Vercel AI SDK 格式
- 保持认证机制一致性
- TypeScript 类型安全
- 兼容 Teact 框架

🎯 **效果：**
- 可正确处理当前服务端返回的流式响应
- 无解析错误
- UI 正常更新
- 代码符合项目规范
