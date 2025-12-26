import React from '../../../../lib/teact/teact';

import './input-translate-tip.scss';

const InputTranslateTip = () => {
  return (
    <div className="input-translate-tip">
      <span>Sending messages in another language? Turn on real-time translation.</span>
      <div className="input-translate-tip-arrow" />
    </div>
  );
};

export default InputTranslateTip;
