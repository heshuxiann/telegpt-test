/* eslint-disable react-hooks-static-deps/exhaustive-deps */
/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from '@teact';
import type { GrammarlyCheckItem } from '../../../utils/grammarly';
import type { GrammarTabProps } from '../GrammarTool';

import { getCorrectedText, grammarlyShorten } from '../../../utils/grammarly';

import SkeletonScreen from '../Skeleton/SkeletonScreen';
import HighlightedText from './HighlightedText';

const ShortenTab = (props:GrammarTabProps) => {
  const { text, setHtml, onClose } = props;
  const [loading, setLoading] = useState(true);
  const [grammarlyResult, setGrammarlyResult] = useState<GrammarlyCheckItem[]>([]);
  function handleImprove() {
    grammarlyShorten(text).then((result) => {
      if (result.data.errors) {
        setGrammarlyResult(result.data.errors);
        setLoading(false);
      } else {
        throw new Error('No errors found in the text');
      }
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Error checking grammar:', err);
      setLoading(false);
      setGrammarlyResult([]);
    });
  }

  useEffect(() => {
    handleImprove();
  }, [text]);

  const handleAccept = useCallback(() => {
    if (grammarlyResult) {
      const newText = getCorrectedText(text, grammarlyResult);
      setHtml(newText);
      onClose();
    }
  }, [grammarlyResult]);
  return (
    <div>
      <h2 className="grammar-tool-tab-content-title">Condense wordy sections</h2>
      {loading ? (<SkeletonScreen />) : (
        <>
          <HighlightedText text={text} errors={grammarlyResult} />
          <button color="default" className='border-[#D9D9D9] border-[1px] px-[8px] py-[4px] rounded-[6px]' onClick={handleAccept}>
            Accept
          </button>
        </>
      )}
    </div>
  );
};

export default ShortenTab;
