# Get Messages Tool - 前端实现文档

## 概述

本文档说明了前端如何封装 `get_messages` 工具，用于响应服务端通过 WebSocket 发送的消息获取请求。

## 架构流程

```
┌────────────────────────────────────────────────────────────────┐
│  服务端 (telegpt/src/app/chat/route.js)                        │
│                                                                │
│  executeAgentWithLangGraph()                                   │
│      │                                                          │
│      ▼                                                          │
│  LangGraph Agent 需要获取消息                                   │
│      │                                                          │
│      ▼                                                          │
│  通过 requestFromClient() 发送 WebSocket 请求                   │
│  {                                                             │
│    action: 'get_messages',                                     │
│    params: {                                                   │
│      chatId, startTime, endTime, limit, senderIds             │
│    }                                                           │
│  }                                                             │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 │ WebSocket
                 │
┌────────────────▼───────────────────────────────────────────────┐
│  前端 (telegram-tt)                                            │
│                                                                │
│  ┌──────────────────────────────────────┐                     │
│  │ TelGPTWebSocket                      │                     │
│  │ (src/util/telegptWebSocket.ts)       │                     │
│  │                                       │                     │
│  │ onMessage 回调接收消息                 │                     │
│  └──────────┬───────────────────────────┘                     │
│             │                                                  │
│             ▼                                                  │
│  ┌──────────────────────────────────────┐                     │
│  │ WebSocket Message Handler            │                     │
│  │ (src/global/actions/apiUpdaters/     │                     │
│  │  initial.ts)                         │                     │
│  │                                       │                     │
│  │ 检测 message.type === 'tool_call'     │                     │
│  └──────────┬───────────────────────────┘                     │
│             │                                                  │
│             ▼                                                  │
│  ┌──────────────────────────────────────┐                     │
│  │ handleTelGPTToolCall()               │                     │
│  │ (src/util/telegptToolHandler.ts)     │                     │
│  │                                       │                     │
│  │ 根据 action 分发到对应处理器           │                     │
│  └──────────┬───────────────────────────┘                     │
│             │                                                  │
│             ▼                                                  │
│  ┌──────────────────────────────────────┐                     │
│  │ handleGetMessages()                  │                     │
│  │                                       │                     │
│  │ 1. 从全局状态获取 chat                 │                     │
│  │ 2. 调用 callApi('fetchMessages')     │                     │
│  │ 3. 过滤消息 (时间、发送者)              │                     │
│  │ 4. 格式化消息为服务端期望格式            │                     │
│  └──────────┬───────────────────────────┘                     │
│             │                                                  │
│             ▼                                                  │
│  ┌──────────────────────────────────────┐                     │
│  │ 构造响应消息                          │                     │
│  │ {                                    │                     │
│  │   type: 'tool_response',             │                     │
│  │   data: {                            │                     │
│  │     requestId,                       │                     │
│  │     success: true,                   │                     │
│  │     data: {                          │                     │
│  │       chatId,                        │                     │
│  │       messageCount,                  │                     │
│  │       messages: [...]                │                     │
│  │     }                                │                     │
│  │   }                                  │                     │
│  │ }                                    │                     │
│  └──────────┬───────────────────────────┘                     │
│             │                                                  │
│             ▼                                                  │
│  通过 TelGPTWebSocket.send() 发送响应                          │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 │ WebSocket
                 │
┌────────────────▼───────────────────────────────────────────────┐
│  服务端接收响应                                                 │
│                                                                │
│  LangGraph Agent 获取消息数据并继续处理                          │
└────────────────────────────────────────────────────────────────┘
```

## 文件结构

### 1. 工具处理器 (`src/util/telegptToolHandler.ts`)

**新建文件**，包含以下核心功能：

#### 类型定义

```typescript
// 工具调用请求消息
interface TelGPTToolCallMessage {
  type: 'tool_call';
  data: {
    requestId: string;
    action: string;
    params: Record<string, any>;
  };
}

// 工具调用响应消息
interface TelGPTToolResponseMessage {
  type: 'tool_response';
  data: {
    requestId: string;
    success: boolean;
    data?: any;
    error?: string;
  };
}
```

#### 主要函数

**`handleTelGPTToolCall(message)`**
- 入口函数，处理所有工具调用请求
- 根据 `action` 分发到对应的处理器
- 捕获异常并返回错误响应

**`handleGetMessages(params)`**
- 处理 `get_messages` action
- 参数：
  - `chatId`: 聊天 ID（必需）
  - `startTime`: 开始时间戳（毫秒，可选）
  - `endTime`: 结束时间戳（毫秒，可选）
  - `limit`: 消息数量限制（默认 100，最大 500）
  - `senderIds`: 发送者 ID 数组（可选）

**`fetchMessagesWithFilters(options)`**
- 从 Telegram API 获取并过滤消息
- 支持时间范围过滤
- 支持发送者过滤
- 批量获取，自动分页

**`formatMessageForAgent(message)`**
- 将 `ApiMessage` 格式化为服务端期望的格式
- 转换字段：
  - `id` → `messageId` (转为字符串)
  - `content.text.text` → `content`
  - `senderId` → `senderId` (带发送者姓名)
  - `date` (秒) → `timestamp` (毫秒)

### 2. WebSocket 消息处理器 (`src/global/actions/apiUpdaters/initial.ts`)

**修改内容**：

在 `onUpdateCurrentUser` 函数中，`initTelGPTWebSocket` 的 `onMessage` 回调中添加：

```typescript
// 处理 TelGPT 工具调用请求
if (message.type === 'tool_call') {
  handleTelGPTToolCall(message as TelGPTToolCallMessage).then((response) => {
    const ws = getTelGPTWebSocket();
    if (ws) {
      ws.send(response);
      console.log('[TelGPT Tool] Response sent:', response);
    }
  }).catch((error) => {
    console.error('[TelGPT Tool] Tool call failed:', error);
  });
}
```

## 数据格式

### 服务端请求格式

```typescript
{
  type: 'tool_call',
  data: {
    requestId: 'uuid-v4',
    action: 'get_messages',
    params: {
      chatId: '-1001234567890',
      startTime: 1706227200000,  // 可选，Unix 时间戳（毫秒）
      endTime: 1706313600000,    // 可选，Unix 时间戳（毫秒）
      limit: 100,                // 可选，默认 100
      senderIds: ['123456', '789012']  // 可选
    }
  },
  timestamp: 1706227200000
}
```

### 前端响应格式

**成功响应**:
```typescript
{
  type: 'tool_response',
  data: {
    requestId: 'uuid-v4',
    success: true,
    data: {
      success: true,
      chatId: '-1001234567890',
      messageCount: 42,
      messages: [
        {
          messageId: '123456',
          content: '消息内容',
          senderId: '123456',
          senderName: 'John Doe',
          timestamp: 1706227200000
        },
        // ... 更多消息
      ]
    }
  },
  timestamp: 1706227200000
}
```

**错误响应**:
```typescript
{
  type: 'tool_response',
  data: {
    requestId: 'uuid-v4',
    success: false,
    error: '错误信息',
  },
  timestamp: 1706227200000
}
```

## 时间戳处理

**重要提示**: 需要注意时间戳单位转换

- **服务端**: Unix 时间戳使用**毫秒** (milliseconds)
- **Telegram API**: Unix 时间戳使用**秒** (seconds)
- **前端 ApiMessage.date**: Unix 时间戳使用**秒** (seconds)

转换示例：
```typescript
// 服务端 → Telegram API
const startDeadline = startTime ? Math.floor(startTime / 1000) : undefined;

// Telegram API → 服务端
const timestamp = message.date * 1000;
```

## 错误处理

工具处理器包含完善的错误处理：

1. **Chat 不存在**: 返回友好错误消息
2. **API 调用失败**: 捕获异常并返回错误响应
3. **无消息返回**: 返回空数组而非错误
4. **类型错误**: TypeScript 类型检查确保数据格式正确

## 扩展新工具

要添加新的工具，只需在 `handleTelGPTToolCall` 中添加新的 case：

```typescript
switch (action) {
  case 'get_messages':
    result = await handleGetMessages(params);
    break;

  case 'send_message':  // 新工具
    result = await handleSendMessage(params);
    break;

  // ... 更多工具
}
```

## 测试建议

### 1. 基本功能测试

```javascript
// 测试获取最近 100 条消息
{
  action: 'get_messages',
  params: {
    chatId: '-1001234567890',
    limit: 100
  }
}
```

### 2. 时间过滤测试

```javascript
// 测试获取最近一周的消息
{
  action: 'get_messages',
  params: {
    chatId: '-1001234567890',
    startTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
    limit: 200
  }
}
```

### 3. 发送者过滤测试

```javascript
// 测试获取特定用户的消息
{
  action: 'get_messages',
  params: {
    chatId: '-1001234567890',
    senderIds: ['123456', '789012'],
    limit: 100
  }
}
```

### 4. 组合过滤测试

```javascript
// 测试时间 + 发送者组合过滤
{
  action: 'get_messages',
  params: {
    chatId: '-1001234567890',
    startTime: Date.now() - 24 * 60 * 60 * 1000,  // 最近一天
    senderIds: ['123456'],
    limit: 50
  }
}
```

## 注意事项

1. **性能优化**:
   - 限制单次最多获取 500 条消息
   - 使用批量获取和分页机制
   - 只返回文本消息（过滤掉媒体消息）

2. **安全性**:
   - 验证 chat 是否存在
   - 确保用户有权限访问该 chat
   - 过滤敏感信息

3. **可维护性**:
   - 清晰的类型定义
   - 完善的错误处理
   - 详细的日志输出

4. **兼容性**:
   - 遵循项目代码规范
   - 使用项目现有的 API 和工具函数
   - 不引入新的外部依赖

## 调试技巧

在浏览器控制台查看日志：

```javascript
// 工具调用日志
[TelGPT Tool] Handling tool call: get_messages { chatId: '...', ... }

// 获取消息日志
[TelGPT Tool] Fetching messages for chat -1001234567890

// 响应发送日志
[TelGPT Tool] Response sent: { type: 'tool_response', ... }

// 错误日志
[TelGPT Tool] Error: Chat not found: -1001234567890
```

## 相关文件

- `src/util/telegptToolHandler.ts` - 工具处理器（新建）
- `src/global/actions/apiUpdaters/initial.ts` - WebSocket 消息处理（修改）
- `src/util/telegptWebSocket.ts` - WebSocket 客户端
- `src/api/gramjs/methods/messages.ts` - 消息 API
- `src/components/chatAssistant/utils/fetch-messages.ts` - 消息获取工具函数

## 总结

通过这个实现，前端可以：

1. ✅ 接收服务端的 `get_messages` 工具调用请求
2. ✅ 从 Telegram API 获取并过滤消息
3. ✅ 格式化消息为服务端期望的格式
4. ✅ 通过 WebSocket 返回响应给服务端
5. ✅ 完善的错误处理和日志记录
6. ✅ 易于扩展新的工具功能

这个实现遵循了项目的架构规范，复用了现有的 API 和工具函数，不引入新的依赖，保持了代码的简洁和可维护性。
