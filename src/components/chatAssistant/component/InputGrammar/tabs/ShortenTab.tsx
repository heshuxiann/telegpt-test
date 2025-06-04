/* eslint-disable react-hooks-static-deps/exhaustive-deps */
/* eslint-disable max-len */
import React, { useCallback, useEffect } from 'react';
import { Button } from 'antd';

import type { GrammarlyCheckItem } from '../../../utils/grammarly';
import type { GrammarTabProps } from '../GrammarTool';

import { getCorrectedText, grammarlyShorten } from '../../../utils/grammarly';

import SkeletonScreen from '../Skeleton/SkeletonScreen';
import HighlightedText from './HighlightedText';

const ShortenTab = (props:GrammarTabProps) => {
  const { text, setHtml, onClose } = props;
  const [loading, setLoading] = React.useState(true);
  const [grammarlyResult, setGrammarlyResult] = React.useState<GrammarlyCheckItem[]>([]);
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
  }, []);

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
          <Button color="default" variant="outlined" onClick={handleAccept}>
            Accept
          </Button>
        </>
      )}
    </div>
  );
};

export default ShortenTab;
