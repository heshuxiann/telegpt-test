/**
 * MCP 工具调用消息处理
 * 集成到全局 WebSocket 消息处理流程中
 */

import { getMcpWebSocket } from '../components/chatAssistant/agent/mcp-websocket';

export interface McpToolCallMessage {
  type: 'mcp-tool-call';
  data: {
    requestId: string;
    action: string;
    params: Record<string, any>;
  };
}

export interface McpToolResponseMessage {
  type: 'mcp-tool-response';
  data: {
    requestId: string;
    success: boolean;
    data?: any;
    error?: string;
  };
}

/**
 * 处理 MCP 工具调用请求
 */
export async function handleMcpToolCall(message: McpToolCallMessage) {
  const { requestId, action, params } = message.data;

  try {
    // eslint-disable-next-line no-console
    console.log(`[MCP] Tool call request: ${action}`, params);

    // 根据 action 类型执行不同的工具调用
    const result = await executeMcpTool(action, params);

    // 返回成功响应
    return {
      type: 'mcp-tool-response',
      data: {
        requestId,
        success: true,
        data: result,
      },
    };
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('[MCP] Tool call error:', error);

    // 返回错误响应
    return {
      type: 'mcp-tool-response',
      data: {
        requestId,
        success: false,
        error: error.message || 'Unknown error',
      },
    };
  }
}

/**
 * 执行具体的 MCP 工具
 */
async function executeMcpTool(action: string, params: Record<string, any>): Promise<any> {
  const mcpWs = getMcpWebSocket();

  if (!mcpWs.isConnected()) {
    throw new Error('MCP WebSocket is not connected');
  }

  // 通过 WebSocket 发送工具调用请求
  return mcpWs.sendRequest(action, params);
}

/**
 * 处理 MCP 工具响应
 */
export function handleMcpToolResponse(message: McpToolResponseMessage) {
  const { requestId, success, data, error } = message.data;

  // eslint-disable-next-line no-console
  console.log(`[MCP] Tool response for ${requestId}:`, success ? data : error);

  // 这里可以触发事件或更新状态
  // 例如：更新消息列表、触发 UI 更新等
}
