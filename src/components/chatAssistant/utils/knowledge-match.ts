/* eslint-disable no-console */
import { pipeline } from '@xenova/transformers';

import { ChataiStores } from '../store';

const sentenceEmbedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

// 从知识库获取关键词列表
async function getKnowledgeKeywords(): Promise<string[]> {
  try {
    const knowledgeList = await ChataiStores.knowledge?.getAllKnowledge();
    if (!knowledgeList || knowledgeList.length === 0) {
      return [];
    }

    // 提取所有知识条目的问题和纯文本内容作为关键词
    const keywords: string[] = [];
    knowledgeList.forEach((knowledge) => {
      if (knowledge.question) {
        keywords.push(knowledge.question);
      }
      if (knowledge.plainText) {
        // 将长文本分割成句子作为关键词
        const sentences = knowledge.plainText.split(/[。！？.!?]/).filter((s) => s.trim().length > 0);
        keywords.push(...sentences.map((s) => s.trim()));
      }
    });

    return keywords;
  } catch (error) {
    console.error('获取知识库关键词失败:', error);
    return [];
  }
}

// 关键词匹配：检查文本是否包含知识库关键词
async function keywordMatchIntent(text: string): Promise<boolean> {
  const cleanedInput = text.toLowerCase().trim();
  const keywords = await getKnowledgeKeywords();

  return keywords.some((keyword) =>
    cleanedInput.includes(keyword.toLowerCase()),
  );
}

// 语义相似度：计算文本与知识库样本的余弦相似度
async function semanticSimilarityIntent(text: string): Promise<boolean> {
  try {
    const keywords = await getKnowledgeKeywords();
    if (keywords.length === 0) {
      return false;
    }

    // 将用户输入与知识库样本转换为向量
    const userVector = await sentenceEmbedder(text);
    const userVectorArray = userVector.data;

    let maxSimilarity = 0;
    for (const sample of keywords) {
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
    return await keywordMatchIntent(text); // 失败时回退到关键词匹配
  }
}

/**
 * 检查用户输入是否匹配知识库内容
 * @param {string} text - 用户输入的文本
 * @returns {Promise<boolean>} - 是否匹配知识库内容
 */
async function hasKnowledgeIntent(text: string): Promise<boolean> {
  return await semanticSimilarityIntent(text);
}

/**
 * 获取与用户输入最相似的知识库内容
 * @param {string} text - 用户输入的文本
 * @returns {Promise<{answer: string; score: number} | undefined>} - 最相似的知识库内容和相似度分数
 */
async function getBestKnowledgeMatch(text: string): Promise<{ answer: string; score: number } | undefined> {
  try {
    const knowledgeList = await ChataiStores.knowledge?.getAllKnowledge();
    if (!knowledgeList || knowledgeList.length === 0) {
      return undefined;
    }

    // 将用户输入转换为向量
    const userVector = await sentenceEmbedder(text);
    const userVectorArray = userVector.data;

    let maxSimilarity = 0;
    let bestMatch: { answer: string; score: number } | undefined = undefined;

    for (const knowledge of knowledgeList) {
      // 只对问题进行相似度计算
      if (!knowledge.question) {
        continue;
      }

      const sampleVector = await sentenceEmbedder(knowledge.question);
      const sampleVectorArray = sampleVector.data;

      // 计算余弦相似度
      let dotProduct = 0, norm1 = 0, norm2 = 0;
      for (let i = 0; i < userVectorArray.length && i < sampleVectorArray.length; i++) {
        dotProduct += userVectorArray[i] * sampleVectorArray[i];
        norm1 += userVectorArray[i] ** 2;
        norm2 += sampleVectorArray[i] ** 2;
      }

      // 防止NaN：检查向量长度和计算结果
      if (norm1 === 0 || norm2 === 0 || !isFinite(dotProduct) || !isFinite(norm1) || !isFinite(norm2)) {
        continue;
      }

      const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));

      // 检查相似度是否为有效数值
      if (!isFinite(similarity) || isNaN(similarity)) {
        continue;
      }

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        const answer = knowledge.plainText;
        bestMatch = { answer, score: similarity };
      }
    }

    return bestMatch;
  } catch (error) {
    console.error('获取最佳知识库匹配失败:', error);
    return undefined;
  }
}

// 导出hasKnowledgeIntent方法（默认导出）
export default hasKnowledgeIntent;
// 导出getBestKnowledgeMatch方法
export { getBestKnowledgeMatch };
