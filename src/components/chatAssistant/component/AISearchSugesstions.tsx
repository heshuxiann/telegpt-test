/* eslint-disable max-len */
import React from 'react';

import SerenaIcon from '../assets/serena.png';

const suggestions = [
  'Who is interested in early investments in GameFi projects?',
  'Which meme KOLs are worth following?',
  'Which of my contacts interacts with Paulo the most?',
  'Which friends do Paulo and I share?',
  'Find messages about Twitter Space collaboration.',
];
const AISearchSugesstions = (props:{ handleSearch: (query:string)=>void }) => {
  const { handleSearch } = props;
  return (
    <div className="flex flex-col mx-[22px]">
      <img className="w-[52px] h-[52px] rounded-full" src={SerenaIcon} alt="" />
      <span className="font-bold text-[24px]">AI Search</span>
      <span className="mb-[12px] text-[14px]">Intelligent deep search experience.</span>
      {suggestions.map((item) => {
        return (
          <div className="px-[10px] py-[6px] mb-[8px] rounded-[8px] bg-[#F8F2FF] text-[14px]" onClick={() => handleSearch(item)}>
            {item}
          </div>
        );
      })}
    </div>
  );
};

export default AISearchSugesstions;
