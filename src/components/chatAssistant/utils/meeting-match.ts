/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
import { pipeline } from '@xenova/transformers';
const sentenceEmbedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

// 核心会议关键词（多语言）- 专注于会议安排的核心概念
const GLOBAL_MEETING_KEYWORDS = {
  // 会议安排核心词汇
  meeting: ['meeting', 'conference', 'discussion', 'call', 'session'],
  schedule: ['schedule', 'arrange', 'plan', 'organize', 'book', 'set up'],
  time: ['time', 'when', 'available', 'free', 'appointment'],

  // 中文
  zh: {
    meeting: ['会议', '会面', '讨论', '开会', '商讨', '洽谈'],
    schedule: ['安排', '预定', '预约', '约', '定', '组织'],
    time: ['时间', '什么时候', '何时', '方便', '有空', '空闲'],
  },

  // 英文
  en: {
    meeting: ['meeting', 'conference', 'discussion', 'call', 'session', 'talk'],
    schedule: ['schedule', 'arrange', 'plan', 'organize', 'book', 'set up'],
    time: ['time', 'when', 'available', 'free', 'appointment', 'slot'],
  },

  // 法语
  fr: {
    meeting: ['réunion', 'conférence', 'discussion', 'rendez-vous', 'entretien'],
    schedule: ['programmer', 'organiser', 'planifier', 'réserver', 'fixer'],
    time: ['temps', 'quand', 'disponible', 'libre', 'créneau'],
  },

  // 德语
  de: {
    meeting: ['Meeting', 'Besprechung', 'Konferenz', 'Termin', 'Gespräch'],
    schedule: ['planen', 'organisieren', 'vereinbaren', 'buchen', 'einrichten', 'können wir'],
    time: ['Zeit', 'wann', 'verfügbar', 'frei', 'Termin', 'wann haben sie zeit', 'für eine besprechung'],
  },

  // 西班牙语
  es: {
    meeting: ['reunión', 'conferencia', 'discusión', 'cita', 'encuentro'],
    schedule: ['programar', 'organizar', 'agendar', 'planificar', 'coordinar'],
    time: ['tiempo', 'cuándo', 'disponible', 'libre', 'horario'],
  },

  // 日语
  ja: {
    meeting: ['会議', 'ミーティング', '打ち合わせ', '相談', '話し合い'],
    schedule: ['予定', '調整', '設定', '手配', '準備', 'ミーティングの時間を調整', '時間を調整しましょう'],
    time: ['時間', 'いつ', '都合', '空き', 'スケジュール', 'いつお時間ありますか'],
  },

  // 韩语
  ko: {
    meeting: ['회의', '미팅', '상담', '논의', '만남'],
    schedule: ['예정', '조율', '계획', '준비', '설정'],
    time: ['시간', '언제', '가능', '여유', '일정'],
  },

  // 印地语
  hi: {
    meeting: ['बैठक', 'मीटिंग', 'चर्चा', 'सभा', 'मुलाकात'],
    schedule: ['आयोजित', 'व्यवस्थित', 'निर्धारित', 'तय', 'योजना'],
    time: ['समय', 'कब', 'उपलब्ध', 'खाली', 'मौका'],
  },
};

// 语言检测函数
function detectLanguage(text: string) {
  // 日文字符（平假名、片假名）- 优先检测，避免与中文混淆
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  // 韩文字符
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  // 印地语字符（天城文）
  if (/[\u0900-\u097f]/.test(text)) return 'hi';
  // 德语特殊字符（优先检测，避免与法语混淆）
  if (/[äöüß]/.test(text.toLowerCase())) return 'de';
  // 法语特殊字符
  if (/[àâéèêëïîôöùûüÿç]/.test(text.toLowerCase())) return 'fr';
  // 西班牙语特殊字符
  if (/[ñáéíóúü¿¡]/.test(text.toLowerCase())) return 'es';
  // 中文字符（最后检测，避免误判）
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  // 默认英语
  return 'en';
}

// 关键词匹配检测
function keywordBasedDetection(text: string) {
  const lowerText = text.toLowerCase();
  const detectedLang = detectLanguage(text);

  // 获取对应语言的关键词
  const langKeywords = GLOBAL_MEETING_KEYWORDS[detectedLang] || GLOBAL_MEETING_KEYWORDS.en;

  let meetingScore = 0;
  let scheduleScore = 0;
  let timeScore = 0;

  // 检查会议相关词汇
  for (const keyword of langKeywords.meeting) {
    if (lowerText.includes(keyword.toLowerCase())) {
      meetingScore += 1;
    }
  }

  // 检查安排相关词汇
  for (const keyword of langKeywords.schedule) {
    if (lowerText.includes(keyword.toLowerCase())) {
      scheduleScore += 1;
    }
  }

  // 检查时间相关词汇
  for (const keyword of langKeywords.time) {
    if (lowerText.includes(keyword.toLowerCase())) {
      timeScore += 1;
    }
  }

  // 计算总分
  const totalScore = meetingScore + scheduleScore + timeScore;

  // 如果包含会议词汇且有安排或时间词汇，则认为是会议意图
  const isMeetingIntent = (meetingScore > 0 && (scheduleScore > 0 || timeScore > 0)) || totalScore >= 2;

  return {
    isMeetingIntent,
    confidence: Math.min(totalScore / 3, 1), // 标准化到0-1
    details: {
      language: detectedLang,
      meetingScore,
      scheduleScore,
      timeScore,
      totalScore,
    },
  };
}

// 语义相似度检测（作为补充）
const MEETING_SEMANTIC_TEMPLATES = [
  'schedule a meeting',
  'arrange meeting time',
  'plan discussion',
  'organize conference',
  'book appointment',
  'set up call',
  'when are you available',
  'let us meet',
  '安排会议',
  '预定时间',
  '约个会',
  '什么时候方便',
];

const vectorCache = new Map();

async function getVectorWithCache(text: string) {
  if (vectorCache.has(text)) {
    return vectorCache.get(text);
  }

  try {
    const vector = await sentenceEmbedder(text);
    const flatVector = Array.from(vector.data);
    vectorCache.set(text, flatVector);
    return flatVector;
  } catch (error) {
    console.warn(`向量计算失败: ${text}`, error);
    return null;
  }
}

function cosineSimilarity(vecA: number[], vecB: number[]) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

async function semanticBasedDetection(text: string) {
  try {
    const inputVector = await getVectorWithCache(text);
    if (!inputVector) {
      return { isMeetingIntent: false, confidence: 0, details: { error: 'Vector computation failed' } };
    }

    let maxSimilarity = 0;
    let bestMatch = '';

    for (const template of MEETING_SEMANTIC_TEMPLATES) {
      const templateVector = await getVectorWithCache(template);
      if (templateVector) {
        const similarity = cosineSimilarity(inputVector, templateVector);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          bestMatch = template;
        }
      }
    }

    const threshold = 0.4;
    const isMeetingIntent = maxSimilarity >= threshold;

    return {
      isMeetingIntent,
      confidence: maxSimilarity,
      details: {
        bestMatch,
        similarity: maxSimilarity,
        threshold,
      },
    };
  } catch (error) {
    console.warn('语义检测失败:', error);
    return { isMeetingIntent: false, confidence: 0, details: { error } };
  }
}

// 混合检测策略
async function detectGlobalMeetingIntent(text: string) {
  // 1. 关键词检测（快速、可靠）
  const keywordResult = keywordBasedDetection(text);

  // 2. 语义检测（深度理解）
  const semanticResult = await semanticBasedDetection(text);

  // 3. 混合决策
  let finalResult = false;
  let finalConfidence = 0;
  let method = '';

  // 如果关键词检测成功且置信度较高，直接采用
  if (keywordResult.isMeetingIntent && keywordResult.confidence >= 0.5) {
    finalResult = true;
    finalConfidence = keywordResult.confidence;
    method = 'keyword';
  } else if (semanticResult.isMeetingIntent && semanticResult.confidence >= 0.5) {
    // 如果语义检测成功且置信度较高，采用语义结果
    finalResult = true;
    finalConfidence = semanticResult.confidence;
    method = 'semantic';
  } else if (keywordResult.isMeetingIntent || semanticResult.isMeetingIntent) {
    // 如果两者都有一定置信度，取较高者
    if (keywordResult.confidence >= semanticResult.confidence) {
      finalResult = keywordResult.isMeetingIntent;
      finalConfidence = keywordResult.confidence;
      method = 'keyword';
    } else {
      finalResult = semanticResult.isMeetingIntent;
      finalConfidence = semanticResult.confidence;
      method = 'semantic';
    }
  }

  console.log(`检测: "${text}"`);
  console.log(`语言: ${keywordResult.details.language}`);
  console.log(`关键词: ${keywordResult.isMeetingIntent} (置信度: ${keywordResult.confidence.toFixed(3)})`);
  console.log(`语义: ${semanticResult.isMeetingIntent} (置信度: ${semanticResult.confidence.toFixed(3)})`);
  console.log(`最终: ${finalResult} (方法: ${method}, 置信度: ${finalConfidence.toFixed(3)})\n`);
  return {
    isMeetingIntent: finalResult,
    confidence: finalConfidence,
    method,
    details: {
      keyword: keywordResult,
      semantic: semanticResult,
    },
  };
}

/**
 * 检查用户输入是否有会议意图
 * @param {string} text - 用户输入的文本
 * @returns {Promise<boolean>} - 是否有会议意图
 */
async function hasMeetingIntent(text: string) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  const matchResult = await detectGlobalMeetingIntent(text);
  // 使用混合策略进行匹配
  return matchResult.isMeetingIntent;
}
export default hasMeetingIntent;
