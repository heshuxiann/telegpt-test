/* eslint-disable no-console */
import { pipeline } from '@xenova/transformers';
const sentenceEmbedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

// 会议相关关键词列表（显式意图）
const MEETING_KEYWORDS = [
  '安排会议',
  '预定时间',
  '找时间开会',
  '创建会议链接',
  '什么时候方便开会',
  '约个会议时间',
  '预约视频会议',
  '定个会议时间',
  '开 Zoom 会',
  '安排 Google Meet',
  '和客户约时间沟通',
  '我想和你约个会议讨论一下',
  '我们找时间安排个会议',
  '是否可以和你约时间开会',
  '咱们什么时候方便开会',
  '想聊聊项目细节',
  'I’d like to schedule a meeting with you to discuss this',
  'Can we arrange a meeting?',
  '约个会',
  '开个会',
  '找时间聊',
  '咱们聊聊',
];

// 关键词匹配：检查文本是否包含会议关键词
function keywordMatchIntent(text: string) {
  const cleanedInput = text.toLowerCase().trim();
  return MEETING_KEYWORDS.some((keyword) =>
    cleanedInput.includes(keyword),
  );
}

// 语义相似度：计算文本与会议样本的余弦相似度
async function semanticSimilarityIntent(text: string) {
  try {
    // 将用户输入与会议样本转换为向量
    const userVector = await sentenceEmbedder(text);
    const userVectorArray = userVector.data;

    let maxSimilarity = 0;
    for (const sample of MEETING_KEYWORDS) {
      const sampleVector = await sentenceEmbedder(sample);
      const sampleVectorArray = sampleVector.data;

      // 计算余弦相似度
      let dotProduct = 0, norm1 = 0, norm2 = 0;
      for (let i = 0; i < userVectorArray.length; i++) {
        dotProduct += userVectorArray[i] * sampleVectorArray[i];
        norm1 += userVectorArray[i] ** 2;
        norm2 += sampleVectorArray[i] ** 2;
      }
      const similarity = norm1 * norm2 === 0 ? 0 : dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
      if (similarity > maxSimilarity) maxSimilarity = similarity;
    }

    // 返回语义判断结果（阈值设为0.7）
    return maxSimilarity >= 0.7;
  } catch (error) {
    console.error('语义相似度计算失败，回退到关键词匹配:', error);
    return keywordMatchIntent(text); // 失败时回退到关键词匹配
  }
}

/**
 * 检查用户输入是否有会议意图
 * @param {string} userInput - 用户输入的文本
 * @param {Object} [options] - 配置选项
 * @param {boolean} [options.useSemantic=false] - 是否使用语义相似度（默认false，用关键词匹配）
 * @returns {Promise<boolean>} - 是否有会议意图
 */
async function hasMeetingIntent(text: string) {
  return await semanticSimilarityIntent(text);
}

// 导出hasMeetingIntent方法（默认导出）
export default hasMeetingIntent;
