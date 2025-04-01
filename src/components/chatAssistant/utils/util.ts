import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
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

export function validateAndFixJsonStructure(jsonString:string) {
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
