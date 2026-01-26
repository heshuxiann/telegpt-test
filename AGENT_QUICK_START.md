# Agent Chat 系统 - 快速开始指南

## ✅ 已完成的功能

1. **流式聊天 API** (`chatWithGptStream`)
   - 使用项目的认证机制
   - 自动管理 userId 和 deviceId
   - 返回 ReadableStream

2. **useAgentChat Hook**
   - 替代 `@ai-sdk/react` 的 `useChat`
   - 管理消息状态和流式响应
   - 支持工具调用和阶段显示

3. **Stream Parser**
   - 支持 Vercel AI SDK 格式（当前）
   - 支持 Agent 事件流格式（未来）
   - 自动检测和切换

4. **UI 组件**
   - PhaseIndicator：显示执行阶段
   - ToolCallCard：显示工具调用状态

## 🚀 使用方法

### 在组件中使用

```typescript
import { useAgentChat } from '../agent/useAgentChat';

function RoomAI({ chatId }: { chatId: string }) {
  const {
    messages,      // 消息列表
    status,        // 'ready' | 'streaming' | 'error'
    currentPhase,  // 当前阶段
    toolCalls,     // 工具调用列表
    append,        // 发送新消息
    stop,          // 停止流式响应
  } = useAgentChat({
    chatId,
    showToolCalls: true,
    detailedCitations: true,
    onError: (error) => {
      console.error('Chat error:', error);
    },
    onFinish: (result) => {
      console.log('Chat finished:', result);
    },
  });

  const handleSend = async (text: string) => {
    await append({
      role: 'user',
      content: text,
      id: uuidv4(),
      createdAt: new Date(),
    });
  };

  return (
    <div>
      {/* 阶段指示器 */}
      {currentPhase && <PhaseIndicator phase={currentPhase} />}

      {/* 工具调用卡片 */}
      {toolCalls.map((tool, i) => (
        <ToolCallCard key={i} tool={tool} />
      ))}

      {/* 消息列表 */}
      <Messages messages={messages} />

      {/* 输入框 */}
      <Input onSubmit={handleSend} disabled={status === 'streaming'} />
      {status === 'streaming' && <button onClick={stop}>停止</button>}
    </div>
  );
}
```

## 📝 当前服务端响应格式

### Vercel AI SDK 格式（正在使用）

```
f:{"messageId":"msg-123"}
0:"当然，没问题！\n\n"
0:"为什么书店里总是那么安静？\n\n"
0:"因为大家都在"阅读"空气！"
e:{"finishReason":"stop","usage":{"promptTokens":105,"completionTokens":23}}
d:{"finishReason":"stop","usage":{"promptTokens":105,"completionTokens":23}}
```

**处理逻辑：**
- `f:` - 元数据（忽略）
- `0:` - 文本内容（累加显示）
- `e:` - 事件/完成
- `d:` - 最终完成状态

### Agent 格式（未来支持）

```json
{"type":"phase_change","phase":"thinking","data":{"message":"正在分析..."}}
{"type":"tool_start","phase":"tool_calling","data":{"toolName":"get_messages"}}
{"type":"text","phase":"generating","data":{"content":"..."}}
{"type":"citation","phase":"generating","data":{"messageId":"123"}}
{"type":"done","phase":"completed","data":{"finishReason":"stop"}}
```

## 🔧 配置项

### chatWithGptStream 参数

```typescript
await chatWithGptStream({
  messages: [                    // 必需：对话历史
    { role: 'user', content: '...' },
    { role: 'assistant', content: '...' },
  ],
  creditCode: 1,                 // 必需：计费代码
  contextData: {                 // 可选：上下文
    chatId: '123',
  },
  options: {                     // 可选：Agent 选项
    showThinking: false,
    showToolCalls: true,
    detailedCitations: true,
  },
});
```

### useAgentChat 配置

```typescript
useAgentChat({
  chatId,                        // 必需：聊天 ID
  showThinking: false,           // 是否显示思考过程
  showToolCalls: true,           // 是否显示工具调用
  detailedCitations: true,       // 是否返回详细引用
  onError: (error) => {},        // 错误回调
  onFinish: (result) => {},      // 完成回调
});
```

## 🎯 测试方法

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 测试基础对话

- 打开 RoomAI 组件
- 输入消息："你好"
- 观察：
  - ✅ 文本流式显示
  - ✅ status 变化：ready → streaming → ready
  - ✅ 无解析错误

### 3. 测试停止功能

- 发送长消息
- 在响应过程中点击停止
- 观察：
  - ✅ 流式响应立即停止
  - ✅ status 变为 ready
  - ✅ 消息保持当前状态

## 🐛 常见问题

### 1. 解析错误

**症状：** 控制台出现 `Failed to parse event`

**原因：** 服务端返回格式不符合预期

**解决：**
- 检查服务端返回格式
- 确认是否是 Vercel AI SDK 格式或 Agent 格式
- 查看 stream-parser.ts 的 `isVercelAIFormat` 逻辑

### 2. 认证失败

**症状：** HTTP 401 或 403 错误

**原因：** 认证 headers 不正确

**解决：**
- 检查 `getApihHeaders()` 返回值
- 确认 userId 存在
- 检查 x-auth-key 格式

### 3. 流式响应中断

**症状：** 响应突然停止，但没有完成

**原因：** 网络问题或服务端错误

**解决：**
- 检查网络连接
- 查看浏览器 Network 面板
- 检查服务端日志

## 📚 相关文档

- `agent/README.md` - 完整的技术文档
- `AGENT_IMPLEMENTATION_SUMMARY.md` - 实现总结
- `AGENT_UPDATE_NOTES.md` - 更新说明
- `agent/AGENT_STREAM_FORMAT.md` - 协议规范

## 🔄 工作流程

```
用户输入
    ↓
append(message)
    ↓
chatWithGptStream()
    ├─ 获取 userId (自动)
    ├─ 获取/生成 deviceId (自动)
    ├─ 构建认证 headers (自动)
    └─ 发送 POST 请求
    ↓
ReadableStream
    ↓
AgentStreamParser
    ├─ 检测格式
    ├─ 解析事件
    └─ 触发回调
    ↓
更新 UI
    ├─ messages (文本)
    ├─ status (状态)
    ├─ currentPhase (阶段)
    └─ toolCalls (工具)
```

## ✨ 特性

- ✅ 流式响应（边接收边显示）
- ✅ 自动认证（无需手动管理）
- ✅ 格式兼容（支持两种格式）
- ✅ 类型安全（完整 TypeScript）
- ✅ 错误处理（网络、解析、业务）
- ✅ 状态管理（ready、streaming、error）
- ✅ 中断支持（stop 函数）
- ✅ 重试支持（reload 函数）

## 🎨 UI 组件示例

### PhaseIndicator

```typescript
<PhaseIndicator phase={currentPhase} />
```

显示：
- 💭 Thinking
- 🔍 Getting data
- ✍️ Generating
- ✅ Completed

### ToolCallCard

```typescript
{toolCalls.map(tool => (
  <ToolCallCard key={tool.toolName} tool={tool} />
))}
```

显示：
- 工具名称和描述
- 参数详情
- 执行状态（pending/success/failed）
- 结果摘要

## 🚧 下一步

- [ ] 实现引用点击跳转
- [ ] 添加思考过程展示
- [ ] 完善错误提示
- [ ] 添加重试机制
- [ ] 优化性能（虚拟滚动等）

## 📞 获取帮助

如遇问题，请检查：
1. 浏览器控制台的错误信息
2. Network 面板的请求详情
3. 服务端日志

关键日志标记：
- `[Agent]` - Hook 相关
- `[AgentStreamParser]` - 解析相关
- `[MCP]` - 工具调用相关
