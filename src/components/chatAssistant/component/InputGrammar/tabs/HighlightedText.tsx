/* eslint-disable react/no-array-index-key */
import React from 'react';

import type { GrammarlyCheckItem } from '../../../utils/grammarly';

type Props = {
  text: string;
  errors: GrammarlyCheckItem[];
};

const HighlightedText: React.FC<Props> = ({ text, errors }) => {
  if (!errors.length) return <p><span>{text}</span></p>;

  // 将原文拆分成高亮块和普通块
  const fragments: React.ReactNode[] = [];
  let lastIndex = 0;

  errors.sort((a, b) => a.offset - b.offset).forEach((error, index) => {
    const {
      offset, length, suggestions,
    } = error;

    // 添加错误前的正常文本
    if (offset > lastIndex) {
      fragments.push(<span key={`normal-${index}`}>{text.slice(lastIndex, offset)}</span>);
    }

    // 添加错误词 + 建议
    const original = text.slice(offset, offset + length);
    const suggestion = suggestions[0] || '';

    fragments.push(
      <span
        key={`error-${index}`}
        className="bg-black/15 line-through mr-[4px]"
      >
        {original}
      </span>,
    );

    fragments.push(
      <span
        key={`suggestion-${index}`}
        className="bg-[#8C42F033] mr-[4px] text-[#8C42F0]"
      >
        {suggestion}
      </span>,
    );

    lastIndex = offset + length;
  });

  // 添加最后剩余的文本
  if (lastIndex < text.length) {
    fragments.push(<span key="end">{text.slice(lastIndex)}</span>);
  }

  return <p>{fragments}</p>;
};

export default HighlightedText;
