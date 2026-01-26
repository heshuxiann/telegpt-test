# Agent 流式响应格式文档

## 概述

Agent 使用统一的事件流格式，所有事件遵循 `{type, phase, data}` 结构。这种设计使得客户端能够清晰地了解当前执行阶段，并根据不同阶段展示不同的UI。

## 请求格式

### HTTP Headers
```
user-id: 7309054898
device-id: ios_E6FE2F70-5659-46FA-834B-E8D29EDE711B
```

### POST Body
```json
{
  "chatId": "11200463399",
  "messages": [
    {
      "role": "user",
      "content": "最近一周提到的问题有哪些，都是谁提的"
    }
  ],
  "options": {
    "showThinking": false,
    "showToolCalls": true,
    "detailedCitations": true
  }
}
```

### 配置选项说明
- `showThinking`: 是否显示思考过程（默认 false）
- `showToolCalls`: 是否显示工具调用信息（默认 true）
- `detailedCitations`: 是否返回详细的引用信息（默认 true）

## 响应格式

响应是 `text/event-stream` 格式，每行一个JSON对象。

### 阶段定义 (Phase)

| Phase | 说明 |
|-------|------|
| `thinking` | 思考阶段 - Agent正在分析问题 |
| `tool_calling` | 工具调用阶段 - 正在执行工具获取数据 |
| `generating` | 生成阶段 - 正在生成回答内容 |
| `completed` | 完成阶段 - 所有处理完成 |
| `error` | 错误阶段 - 发生错误 |

### 事件类型 (Event Type)

#### 1. 阶段变更 (`phase_change`)

**触发时机**: 每次进入新阶段时

```json
{
  "type": "phase_change",
  "phase": "thinking",
  "data": {
    "message": "正在分析您的问题..."
  }
}
```

**常见阶段消息**:
- `thinking`: "正在分析您的问题..."
- `tool_calling`: "正在获取数据..."
- `generating`: "正在整理回答..."

#### 2. 工具调用开始 (`tool_start`)

**触发时机**: 开始执行工具前（需要 `showToolCalls: true`）

```json
{
  "type": "tool_start",
  "phase": "tool_calling",
  "data": {
    "toolName": "get_messages",
    "toolDescription": "获取聊天消息",
    "params": {
      "startTime": 1736380800000,
      "limit": 100
    }
  }
}
```

#### 3. 工具调用结束 (`tool_end`)

**触发时机**: 工具执行完成后（需要 `showToolCalls: true`）

```json
{
  "type": "tool_end",
  "phase": "tool_calling",
  "data": {
    "toolName": "get_messages",
    "success": true,
    "summary": "已获取 100 条消息"
  }
}
```

**失败情况**:
```json
{
  "type": "tool_end",
  "phase": "tool_calling",
  "data": {
    "toolName": "get_messages",
    "success": false,
    "summary": "工具调用失败",
    "error": "Device not connected"
  }
}
```

#### 4. 文本内容 (`text`)

**触发时机**: 生成回答时持续输出

```json
{
  "type": "text",
  "phase": "generating",
  "data": {
    "content": "最近一周提到的问题：\n\n"
  }
}
```

#### 5. 引用信息 (`citation`)

**触发时机**: LLM在输出中使用 `[cite:messageId]` 标记时自动触发（需要 `detailedCitations: true`）

**LLM原始输出**:
```
Mason提到了一些设计改动建议[cite:431]，并询问周一是否能进行审核。
```

**实际发送给客户端**:
```json
{"type":"text","phase":"generating","data":{"content":"Mason提到了一些设计改动建议，并询问周一是否能进行审核。"}}
{"type":"citation","phase":"generating","data":{"index":0,"messageId":"431","content":"Mason提到了一些设计改动建议，并询问周一是否能进行审核","senderName":"Mason","senderId":"123456","timestamp":1736985600000,"chatId":"11200463399"}}
```

**Citation 事件字段说明**:
- `index`: 第几个 citation（从 0 开始），用于按顺序处理
- `messageId`: 被引用的消息 ID
- `content`: 被引用消息的完整内容（客户端用这个字段在文本中查找匹配位置）
- `senderName`: 发送者名称
- `senderId`: 发送者 ID（可选）
- `timestamp`: 消息时间戳
- `chatId`: 聊天 ID

**说明**:
- 系统自动检测并移除 `[cite:messageId]` 标记
- 从工具调用返回的消息缓存中查找对应的messageId
- 生成包含完整消息信息的citation事件
- 客户端接收到的文本中不包含 `[cite:...]` 标记
- 客户端通过 `content` 字段在文本中查找匹配位置，插入可点击的引用标记
- 多个 citation 按 `index` 顺序依次处理

#### 6. 完成 (`done`)

**触发时机**: 所有内容发送完毕

```json
{
  "type": "done",
  "phase": "completed",
  "data": {
    "finishReason": "stop",
    "stats": {
      "totalTokens": 1250,
      "iterations": 2
    }
  }
}
```

#### 7. 错误 (`error`)

**触发时机**: 发生错误时

```json
{
  "type": "error",
  "phase": "error",
  "data": {
    "code": "EXECUTION_ERROR",
    "message": "模型调用失败",
    "recoverable": false
  }
}
```

## 完整流程示例

### 用户提问
```
最近一周提到的问题有哪些，都是谁提的
```

### 服务器响应流
```json
{"type":"phase_change","phase":"thinking","data":{"message":"正在分析您的问题..."}}
{"type":"phase_change","phase":"tool_calling","data":{"message":"正在获取数据..."}}
{"type":"tool_start","phase":"tool_calling","data":{"toolName":"get_messages","toolDescription":"获取聊天消息","params":{"startTime":1736380800000,"limit":100}}}
{"type":"tool_end","phase":"tool_calling","data":{"toolName":"get_messages","success":true,"summary":"已获取 100 条消息"}}
{"type":"phase_change","phase":"generating","data":{"message":"正在整理回答..."}}
{"type":"text","phase":"generating","data":{"content":"最近一周提到的问题：\n\n"}}
{"type":"text","phase":"generating","data":{"content":"翻译功能问题\n"}}
{"type":"text","phase":"generating","data":{"content":"Coral提到输入框翻译无法关闭"}}
{"type":"citation","phase":"generating","data":{"messageId":"361","content":"输入框翻译无法关闭","senderName":"Coral","senderId":"123456","timestamp":1736985600000,"chatId":"11200463399"}}
{"type":"text","phase":"generating","data":{"content":"，打开翻译后中文拼音输入会不停翻译"}}
{"type":"citation","phase":"generating","data":{"messageId":"362","content":"会一直触发翻译","senderName":"Coral","senderId":"123456","timestamp":1736985660000,"chatId":"11200463399"}}
{"type":"text","phase":"generating","data":{"content":"。\n\n"}}
{"type":"text","phase":"generating","data":{"content":"语音转文字问题\n"}}
{"type":"text","phase":"generating","data":{"content":"Mandy反馈语音转文字不准确"}}
{"type":"citation","phase":"generating","data":{"messageId":"401","content":"语音转文字不准确","senderName":"Mandy","senderId":"789012","timestamp":1736990000000,"chatId":"11200463399"}}
{"type":"text","phase":"generating","data":{"content":"。\n\n"}}
{"type":"done","phase":"completed","data":{"finishReason":"stop","stats":{"totalTokens":1250,"iterations":2}}}
```

## 客户端实现指南

### 基础解析器

```javascript
class AgentStreamParser {
  constructor() {
    this.currentPhase = null;
    this.fullText = '';
    this.citations = [];
    this.callbacks = {};
  }

  // 注册事件回调
  on(eventType, callback) {
    this.callbacks[eventType] = callback;
  }

  // 处理单行事件
  handleLine(line) {
    if (!line.trim()) return;

    try {
      const event = JSON.parse(line);

      // 更新阶段
      if (event.phase !== this.currentPhase) {
        this.currentPhase = event.phase;
        this.callbacks.phaseChange?.(event.phase);
      }

      // 分发事件
      switch(event.type) {
        case 'phase_change':
          this.callbacks.phaseChangeMessage?.(event.data.message);
          break;

        case 'tool_start':
          this.callbacks.toolStart?.(event.data);
          break;

        case 'tool_end':
          this.callbacks.toolEnd?.(event.data);
          break;

        case 'text':
          this.fullText += event.data.content;
          this.callbacks.text?.(event.data.content, this.fullText);
          break;

        case 'citation':
          this.citations.push(event.data);
          this.callbacks.citation?.(event.data);
          break;

        case 'done':
          this.callbacks.done?.(event.data, {
            fullText: this.fullText,
            citations: this.citations
          });
          break;

        case 'error':
          this.callbacks.error?.(event.data);
          break;
      }
    } catch (error) {
      console.error('Failed to parse event:', line, error);
    }
  }

  // 重置状态
  reset() {
    this.currentPhase = null;
    this.fullText = '';
    this.citations = [];
  }
}
```

### 使用示例

```javascript
const parser = new AgentStreamParser();

// 监听阶段变更
parser.on('phaseChange', (phase) => {
  updateUIPhase(phase);
});

// 监听阶段消息
parser.on('phaseChangeMessage', (message) => {
  showStatusMessage(message);
});

// 监听工具调用
parser.on('toolStart', (data) => {
  showToolCard({
    name: data.toolDescription,
    status: 'loading',
    params: data.params
  });
});

parser.on('toolEnd', (data) => {
  updateToolCard({
    status: data.success ? 'success' : 'failed',
    summary: data.summary
  });
});

// 监听文本内容
parser.on('text', (chunk, fullText) => {
  appendTextToUI(chunk);
});

// 监听引用
parser.on('citation', (citation) => {
  insertCitationLink({
    messageId: citation.messageId,
    preview: citation.content,
    sender: citation.senderName,
    onClick: () => jumpToMessage(citation.chatId, citation.messageId)
  });
});

// 监听完成
parser.on('done', (stats, result) => {
  markComplete();
  console.log('Final text:', result.fullText);
  console.log('Citations:', result.citations);
});

// 监听错误
parser.on('error', (error) => {
  showError(error.message);
});

// 处理流式响应
fetch('/chat', {
  method: 'POST',
  headers: {
    'user-id': userId,
    'device-id': deviceId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    chatId: '11200463399',
    messages: [{ role: 'user', content: '最近一周提到的问题有哪些' }],
    options: {
      showToolCalls: true,
      detailedCitations: true
    }
  })
})
.then(response => response.body)
.then(stream => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  function read() {
    reader.read().then(({ done, value }) => {
      if (done) return;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      lines.forEach(line => parser.handleLine(line));

      read();
    });
  }

  read();
});
```

### UI 展示建议

#### 1. 阶段指示器
```
[思考中] → [获取数据] → [生成回答] → [完成]
```

#### 2. 工具调用卡片
```
┌─────────────────────────┐
│ 🔧 获取聊天消息         │
│ 参数: 最近7天，100条    │
│ ✅ 已获取 100 条消息    │
└─────────────────────────┘
```

#### 3. 文本内容（带引用）
```
最近一周提到的问题：

翻译功能问题
Coral提到输入框翻译无法关闭 [📎 跳转]，打开翻译后...

语音转文字问题
Mandy反馈语音转文字不准确 [📎 跳转]。
```

#### 4. 加载状态
```
💭 正在分析您的问题...     (thinking)
🔍 正在获取数据...         (tool_calling)
✍️ 正在整理回答...         (generating)
✅ 回答完成               (completed)
```

## 注意事项

1. **事件顺序**: 引用事件 (`citation`) 总是在相关文本内容之后立即发送
2. **阶段保证**: `phase` 字段保证按顺序递进（thinking → tool_calling → generating → completed）
3. **可选事件**: `tool_start` 和 `tool_end` 依赖于 `showToolCalls` 配置
4. **错误恢复**: 遇到错误时会发送 `error` 事件，`recoverable` 字段标识是否可恢复
5. **文本格式**: 所有文本内容都是纯文本格式，不包含 Markdown 符号

## 升级指南

如果你之前使用的是旧版本的 Vercel AI SDK 格式（`0:"text"`），现在需要迁移到新格式：

### 旧格式（已废弃）
```
0:"文本内容"
e:{"type":"citation","messageId":"123"}
d:{"finishReason":"stop"}
```

### 新格式
```json
{"type":"text","phase":"generating","data":{"content":"文本内容"}}
{"type":"citation","phase":"generating","data":{"messageId":"123",...}}
{"type":"done","phase":"completed","data":{"finishReason":"stop"}}
```

### 迁移步骤
1. 移除对 `0:`, `e:`, `d:` 前缀的解析
2. 改为解析完整的 JSON 对象
3. 使用 `type` 字段区分事件类型
4. 使用 `phase` 字段展示当前阶段

## 扩展性

这个格式易于扩展，未来可以添加新的事件类型：

### 结构化数据示例
```json
{
  "type": "structured",
  "phase": "generating",
  "data": {
    "dataType": "summary_stats",
    "stats": {
      "totalIssues": 5,
      "totalUsers": 3,
      "categories": ["翻译", "语音", "界面"]
    }
  }
}
```

### 思考过程示例
```json
{
  "type": "thinking",
  "phase": "thinking",
  "data": {
    "content": "用户询问最近一周的问题，我需要获取近7天的消息记录"
  }
}
```

客户端可以选择性地处理或忽略这些新增的事件类型，不影响向后兼容性。
