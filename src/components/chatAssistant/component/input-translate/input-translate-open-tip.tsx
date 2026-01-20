import React from '../../../../lib/teact/teact';

import './input-translate-tip.scss';

const InputTranslateOpenTip = () => {
  return (
    <div className="input-translate-open-tip">
      <span>Real-time input translation is on. Tap Turn off anytime.</span>
      <div className="input-translate-tip-arrow" />
    </div>
  );
};

export default InputTranslateOpenTip;
