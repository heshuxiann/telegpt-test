const summaryPrompt = `
            请总结上方聊天内容，并根据不同的数据类型填充到相应的 JSON 模板中。
            总结规则:
            # 格式要求
                ## 去除所有空格和换行符，确保 JSON 结构紧凑
                ## 代码块应使用 Markdown 代码块包裹
                ## 校验JSON结构,确保所有JSON数据都有 <!-- json-start --> 和 <!-- json-end --> 标记
                ## 严格遵从JSON规范,确保所有的JSON数据正确
                ## 示例格式:
                    \`\`\`json
                        <!-- json-start: {模板类型} -->
                             {JSON数据}
                        <!-- json-end -->
                    \`\`\`
            # 分类插入 JSON 数据
                ## summary-info:填充摘要信息
                ## main-topic:填充主要讨论的话题
                ## pending-matters:填充待处理事项
                ## garbage-message:填充无用或垃圾消息
            # 数据字段解析
                ## chatId:房间的唯一标识符
                ## chatTitle:房间的标题
                ## senderId:消息发送者的唯一标识符
                ## messageId:消息的唯一标识符
                ## content:消息的内容
            # 数据格式
                ## summary-info(摘要信息)
                    {
                        "summaryMessageCount": 总结的消息总数,
                        "summaryStartTime": 开始时间戳,
                        "summaryEndTime": 结束时间戳,
                        "summaryChatIds": ["房间ID1", "房间ID2", ...]
                    }
                ## main-topic(主要话题)
                    [
                        {
                            "topic": "话题名称",
                             "summaryItems": [
                                {
                                    "title": "摘要内容",
                                    "relevantMessages": [
                                        {
                                            "chatId": "房间ID",
                                            "messageIds": [消息ID1, 消息ID2, ...]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                ## pending-matters(待处理事项)
                    [
                        {
                            "chatId": "房间ID",
                            "chatTitle": "房间名称",
                            "summary": "待处理内容摘要",
                            "relevantMessageIds": [消息ID1, 消息ID2, ...]
                        }
                    ]
                ## garbage-message(垃圾消息)
                    [
                        {
                            "chatId": "房间ID",
                            "chatTitle": "房间名称",
                            "summary": "垃圾信息摘要",
                            "level": "high/low",
                            "relevantMessageIds": [消息ID1, 消息ID2, ...]
                        }
                    ]
            # main-topic(主要话题)总结标准
                ## 总结的JSON是一个数组
                ## 总结主要的话题，例如商务合作，技术交流，项目合作，日常交流等等，话题可以是多个，包括但不局限于枚举的话题。
                ## summaryItems 总结每个话题下面的相关摘要信息,以数组的形势返回
                ## 校验总结的JSON数据结构是否正确,完整
            # garbage-message(垃圾消息)判定标准:
                ## 仅处理 chatType=private 的消息
                ## 若消息包含**“钱包、投资回报、代币发行、拉盘、割韭菜”等敏感词**，则判定为 high(高风险)
                ## 其他无意义或垃圾信息归类为 low(低风险)
           
            # 总结消息偏好:
              ## 过滤所有的无意义消息；
              ## 尽量总结关键信息,保持简洁明了,仅提及核心内容;
              ## 为保证输出内容的完整性,尽量精简总结内容；
        `;
export default summaryPrompt;
