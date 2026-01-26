# Agent Chat 系统集成文档

## 概述

本文档描述了新的 Agent Chat 系统的架构和使用方法。该系统替代了原来的 `@ai-sdk/react` 的 `useChat` hook，实现了完整的流式 Agent 对话功能，支持工具调用和引用。

## 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端 (React)                             │
│                                                                  │
│  ┌────────────────┐    ┌────────────────┐   ┌───────────────┐  │
│  │   RoomAI.tsx   │───▶│  useAgentChat  │──▶│  Stream Parser │  │
│  │  (UI Component)│    │     (Hook)     │   │               │  │
│  └────────────────┘    └────────────────┘   └───────────────┘  │
│                                │                     │           │
│                                │                     │           │
│                         Fetch Stream          Parse Events      │
│                                │                     │           │
└────────────────────────────────┼─────────────────────┼───────────┘
                                 │                     │
                            HTTP Stream             JSON Events
                                 │                     │
┌────────────────────────────────▼─────────────────────▼───────────┐
│                       服务端 (Next.js)                            │
│                                                                   │
│  ┌──────────────┐    ┌─────────────────┐   ┌─────────────────┐ │
│  │ /chat Route  │───▶│  LangGraph      │──▶│   LLM (Gemini)  │ │
│  │              │    │  Agent Executor │   │                 │ │
│  └──────────────┘    └─────────────────┘   └─────────────────┘ │
│         │                      │                                 │
│         │                      │                                 │
│    Event Stream           Tool Calls                             │
│         │                      │                                 │
└─────────┼──────────────────────┼─────────────────────────────────┘
          │                      │
          │               ┌──────▼──────┐
          │               │ MCP Tools   │
          │               │ (WebSocket) │
          │               └─────────────┘
          │                      │
          └──────────────────────┘
```

## 核心模块

### 1. useAgentChat Hook

**位置**: `src/components/chatAssistant/agent/useAgentChat.ts`

替代原来的 `useChat` hook，提供以下功能：
- 流式发送和接收消息
- 解析 Agent 事件流
- 管理对话状态和阶段
- 处理工具调用
- 支持停止和重试

**使用示例**:

```typescript
import { useAgentChat } from '../agent/useAgentChat';

const {
  messages,          // 消息列表
  status,            // 状态: 'ready' | 'streaming' | 'error'
  currentPhase,      // 当前阶段
  toolCalls,         // 工具调用列表
  setMessages,       // 设置消息
  append,            // 添加新消息
  stop,              // 停止流式响应
  reload,            // 重新发送
} = useAgentChat({
  chatId: '123',
  showThinking: false,
  showToolCalls: true,
  detailedCitations: true,
  onError: (error) => { /* 错误处理 */ },
  onFinish: (result) => { /* 完成回调 */ },
});
```

### 2. AgentStreamParser

**位置**: `src/components/chatAssistant/agent/stream-parser.ts`

解析服务端返回的事件流，支持以下事件类型：
- `phase_change`: 阶段变更
- `thinking`: 思考过程
- `tool_start`: 工具调用开始
- `tool_end`: 工具调用结束
- `text`: 文本内容
- `citation`: 引用信息
- `structured`: 结构化数据
- `done`: 完成
- `error`: 错误

### 3. MCP WebSocket Manager

**位置**: `src/components/chatAssistant/agent/mcp-websocket.ts`

管理与服务端的 WebSocket 连接，用于 MCP 工具调用：
- 自动重连
- 请求超时处理
- Promise 风格的 API

**使用示例**:

```typescript
import { getMcpWebSocket } from '../agent/mcp-websocket';

const mcpWs = getMcpWebSocket();

// 发送工具调用请求
const result = await mcpWs.sendRequest('get_messages', {
  chatId: '123',
  startTime: '2024-01-01',
  endTime: '2024-01-31',
  limit: 100,
});
```

### 4. UI 组件

#### PhaseIndicator
显示当前执行阶段的状态指示器。

#### ToolCallCard
显示工具调用的详细信息，包括参数、状态和结果。

## 事件流格式

所有事件遵循统一格式：`{type, phase, data}`

### 阶段 (Phase)

- `thinking`: 思考阶段
- `tool_calling`: 工具调用阶段
- `generating`: 生成阶段
- `completed`: 完成阶段
- `error`: 错误阶段

### 事件示例

```json
// 阶段变更
{"type":"phase_change","phase":"thinking","data":{"message":"正在分析您的问题..."}}

// 工具调用开始
{"type":"tool_start","phase":"tool_calling","data":{"toolName":"get_messages","toolDescription":"获取聊天消息","params":{"chatId":"123"}}}

// 工具调用结束
{"type":"tool_end","phase":"tool_calling","data":{"toolName":"get_messages","success":true,"summary":"已获取 100 条消息"}}

// 文本内容
{"type":"text","phase":"generating","data":{"content":"最近一周提到的问题："}}

// 引用
{"type":"citation","phase":"generating","data":{"index":0,"messageId":"361","content":"输入框翻译无法关闭","senderName":"Coral","timestamp":1736985600000,"chatId":"123"}}

// 完成
{"type":"done","phase":"completed","data":{"finishReason":"stop","stats":{"totalTokens":1250}}}
```

## 集成步骤

### 1. 更新组件

在 `room-ai.tsx` 中：

```typescript
// 旧代码
import { useChat } from '@ai-sdk/react';

const { messages, setMessages, append, stop, status } = useChat({
  api: `${SERVER_API_URL}/chat?userId=${userId}`,
  id: chatId,
});

// 新代码
import { useAgentChat } from '../agent/useAgentChat';

const {
  messages,
  setMessages,
  append,
  stop,
  status,
  currentPhase,
  toolCalls,
} = useAgentChat({
  chatId,
  showToolCalls: true,
  detailedCitations: true,
});
```

### 2. 更新 UI

添加阶段指示器和工具调用展示：

```tsx
{/* 阶段指示器 */}
{currentPhase && status === 'streaming' && (
  <PhaseIndicator phase={currentPhase} />
)}

{/* 工具调用卡片 */}
{toolCalls.length > 0 && (
  <div className={styles.toolCallsContainer}>
    {toolCalls.map((tool, index) => (
      <ToolCallCard key={`${tool.toolName}_${index}`} tool={tool} />
    ))}
  </div>
)}
```

### 3. 配置 WebSocket

在 `initial.ts` 中添加 MCP 工具调用消息处理：

```typescript
import { handleMcpToolCall, handleMcpToolResponse } from '../../../util/mcpToolHandler';

onMessage: (message) => {
  // 现有的订阅和积分更新处理...

  // 处理 MCP 工具调用
  if (message.type === 'mcp-tool-call') {
    handleMcpToolCall(message).then((response) => {
      // 发送响应
    });
  }

  // 处理 MCP 工具响应
  if (message.type === 'mcp-tool-response') {
    handleMcpToolResponse(message);
  }
}
```

## 服务端要求

### HTTP Headers

```
user-id: 7309054898
device-id: web_E6FE2F70-5659-46FA-834B-E8D29EDE711B
Content-Type: application/json
```

### 请求体

```json
{
  "chatId": "11200463399",
  "messages": [
    {
      "role": "user",
      "content": "最近一周提到的问题有哪些"
    }
  ],
  "options": {
    "showThinking": false,
    "showToolCalls": true,
    "detailedCitations": true
  }
}
```

### 响应格式

- Content-Type: `text/event-stream`
- 每行一个 JSON 事件对象
- 符合 `AGENT_STREAM_FORMAT.md` 规范

## 配置选项

- `showThinking`: 是否显示思考过程（默认 false）
- `showToolCalls`: 是否显示工具调用（默认 true）
- `detailedCitations`: 是否返回详细引用（默认 true）

## 错误处理

系统在以下情况会触发错误：
1. HTTP 请求失败
2. 流式响应中断
3. 工具调用失败
4. WebSocket 连接失败

错误会通过 `onError` 回调返回，并更新 status 为 `'error'`。

## 调试

启用日志输出：

```typescript
// 在浏览器控制台查看
[Agent] Processing request for user: 7309054898
[Agent] Phase: 正在分析您的问题...
[Agent] Tool call request: get_messages
[Agent] Citation: {...}
[Agent] Finished: {...}
```

## 注意事项

1. **状态管理**: 确保 `chatId` 存在才能使用 Agent 模式
2. **类型兼容性**: 更新了 `ChatStatus` 类型，移除了 `'submitted'` 状态
3. **内存管理**: 组件卸载时会自动取消正在进行的请求
4. **WebSocket 连接**: MCP WebSocket 会自动管理连接和重连
5. **引用处理**: Citation 事件会在文本内容之后立即发送

## 扩展性

系统设计支持未来扩展：
- 新的事件类型（如 structured data）
- 自定义工具
- 不同的 LLM 提供商
- 多模态支持（图片、音频等）

## 相关文件

- `/src/components/chatAssistant/agent/` - Agent 核心模块
- `/src/components/chatAssistant/room-ai/` - UI 组件
- `/src/global/actions/apiUpdaters/initial.ts` - WebSocket 集成
- `/src/util/mcpToolHandler.ts` - MCP 工具处理器
- `AGENT_STREAM_FORMAT.md` - 完整的协议文档
