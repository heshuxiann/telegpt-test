/* eslint-disable no-null/no-null */
import React from '@teact';

import './StatusResponse.scss';

// import chatAILogoPath from '../../../assets/cgat-ai-logo.png';

const THOUGHT_KEYWORDS = ['thought', 'thinking', 'think', 'thought_chain'];
const CLOSING_TAGS = [...THOUGHT_KEYWORDS, 'response', 'answer'];
export const THOUGHT_REGEX_OPEN = new RegExp(
  THOUGHT_KEYWORDS.map((keyword) => `<${keyword}\\s*(?:[^>]*?)?\\s*>`).join('|'),
);
export const THOUGHT_REGEX_CLOSE = new RegExp(
  CLOSING_TAGS.map((keyword) => `</${keyword}\\s*(?:[^>]*?)?>`).join('|'),
);
export const THOUGHT_REGEX_COMPLETE = new RegExp(
  THOUGHT_KEYWORDS.map(
    (keyword) => `<${keyword}\\s*(?:[^>]*?)?\\s*>[\\s\\S]*?<\\/${keyword}\\s*(?:[^>]*?)?>`,
  ).join('|'),
);
interface IResponseProps {
  content: string;
  showThinking?: boolean;
}

// const ThoughtChainComponent = ({ content }: { content: string }) => {
//   return (
//     <div className="thought-chain-container">
//       <img src={chatAILogoPath} alt="" />
//       <span>
//         {content.replace(THOUGHT_REGEX_OPEN, '').replace(THOUGHT_REGEX_CLOSE, '').replace(/\\n/g, '')}
//       </span>
//     </div>
//   );
// };
const RenderChatContent = ({ content }: { content: string }) => {
  content = content.replace(/\\n/g, '');
  return (
    <div className="chat-content">
      {content}
    </div>
  );
};
const StatusResponse = (response: IResponseProps) => {
  const { content } = response;
  // let thoughtChain: string | undefined = content;
  // let msgToRender = '';
  // // If the message is a perfect thought chain, we can render it directly
  // // Complete == open and close tags match perfectly.
  // if (content.match(THOUGHT_REGEX_COMPLETE)) {
  //   thoughtChain = content.match(THOUGHT_REGEX_COMPLETE)?.[0];
  //   msgToRender = content.replace(THOUGHT_REGEX_COMPLETE, '');
  // }

  // // If the message is a thought chain but not a complete thought chain (matching opening tags but not closing tags),
  // // we can render it as a thought chain if we can at least find a closing tag
  // // This can occur when the assistant starts with <thinking> and then <response>'s later.
  // if (
  //   content.match(THOUGHT_REGEX_OPEN)
  //       && content.match(THOUGHT_REGEX_CLOSE)
  // ) {
  //   const closingTag = content.match(THOUGHT_REGEX_CLOSE)?.[0];
  //   if (closingTag) {
  //     const splitMessage = content.split(closingTag);
  //     thoughtChain = splitMessage[0] + closingTag;
  //     msgToRender = splitMessage[1];
  //   }
  // }
  return (
    <div className="response-container">
      {/* {thoughtChain && showThinking && (
        <ThoughtChainComponent content={thoughtChain} />
      )} */}
      <RenderChatContent content={content} />
    </div>
  );
};

export default StatusResponse;
