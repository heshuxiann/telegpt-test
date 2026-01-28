import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * YYYY/MM DD / HH:mm
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  const isSameDay = date.toDateString() === now.toDateString();
  const isSameYear = date.getFullYear() === now.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const timePart = `${hours}:${minutes}`;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();

  if (isSameDay) {
    return timePart;
  } else if (isSameYear) {
    return `${month} ${day} / ${timePart}`;
  } else {
    return `${date.getFullYear()}/${month} ${day} / ${timePart}`;
  }
}

export function validateAndFixJsonStructure(jsonString: string) {
  // 计数大括号和方括号的数量
  let braceCount = 0;
  let bracketCount = 0;

  // 记录所有多余或缺失的闭合符号
  let fixedJsonString = jsonString;

  // 遍历 JSON 字符串，检查并计算每个括号
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
    } else if (char === '[') {
      bracketCount++;
    } else if (char === ']') {
      bracketCount--;
    }
  }

  // 如果大括号数量不匹配，补充缺失的大括号
  while (braceCount > 0) {
    fixedJsonString += '}'; // 补充闭合大括号
    braceCount--;
  }

  while (braceCount < 0) {
    fixedJsonString = `{${fixedJsonString}`; // 补充开始大括号
    braceCount++;
  }

  // 如果方括号数量不匹配，补充缺失的方括号
  while (bracketCount > 0) {
    fixedJsonString += ']'; // 补充闭合方括号
    bracketCount--;
  }

  while (bracketCount < 0) {
    fixedJsonString = `[${fixedJsonString}`; // 补充开始方括号
    bracketCount++;
  }

  // 最后尝试解析 JSON，检查是否格式正确
  try {
    const parsed = JSON.parse(fixedJsonString);
    return { valid: true, parsed, fixedJson: fixedJsonString };
  } catch (error) {
    return { valid: false, error };
  }
}


export function extractCalendlyLinks(text: string): string[] {
  const regex = /https:\/\/calendly\.com\/[^\s?]+\/[^\s?]+(?:\?[^\s]*)?/g;
  return text.match(regex) || [];
}

// compare version
export function compareVersion(version1: any, version2: any) {
  const arr1 = version1.split('.');
  const arr2 = version2.split('.');
  const len = Math.max(arr1.length, arr2.length);

  while (arr1.length < len) {
    arr1.push('0');
  }
  while (arr2.length < len) {
    arr2.push('0');
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(arr1[i] || 0, 10);
    const num2 = parseInt(arr2[i] || 0, 10);
    if (num1 > num2) {
      return 1; // version1 > version2
    } else if (num1 < num2) {
      return -1; // version1 < version2
    }
  }
  return 0; // version1 == version2
}

/**
 * 解析 Postgres `timestamp without time zone` 并格式化输出
 * @param ts Postgres 返回的时间字符串，例如 "2025-09-23 03:25:19.903113"
 * @param options.timeZone 时区，默认取当前系统时区
 * @param options.format 格式化字符串，支持 YYYY、MM、DD、HH、mm、ss
 * @returns 格式化后的时间字符串
 */
export function formatPostgresTimestamp(
  ts: string,
  options: { timeZone?: string; format?: string } = {},
): string {
  const {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
    format = 'YYYY-MM-DD HH:mm:ss',
  } = options;

  // 解析为 UTC Date
  const date = new Date(ts.replace(' ', 'T') + 'Z');

  // Intl API 获取目标时区的各部分
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== 'literal') acc[part.type] = part.value;
      return acc;
    }, {});

  // 按格式替换
  return format
    .replace('YYYY', parts.year)
    .replace('MM', parts.month)
    .replace('DD', parts.day)
    .replace('HH', parts.hour)
    .replace('mm', parts.minute)
    .replace('ss', parts.second);
}
