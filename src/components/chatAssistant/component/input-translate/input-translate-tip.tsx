import React from '../../../../lib/teact/teact';

import './input-translate-tip.scss';

const InputTranslateTip = () => {
  return (
    <div className="input-translate-tip">
      <span>Enter your native language, and it will auto-translate to the set language upon sending.</span>
      <div className="input-translate-tip-arrow" />
    </div>
  );
};

export default InputTranslateTip;
