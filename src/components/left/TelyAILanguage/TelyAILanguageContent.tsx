import React from '@teact';
import type { FC } from '../../../lib/teact/teact';
import {
  memo,
} from '../../../lib/teact/teact';

import useHistoryBack from '../../../hooks/useHistoryBack';
import useOldLang from '../../../hooks/useOldLang';

import TelyAILanguageSelector from './TelyAILanguageSelector';

type OwnProps = {
  isActive?: boolean;
  onReset: () => void;
};
const TelyAILanguageContent: FC<OwnProps> = ({
  isActive,
  onReset,
}) => {
  const lang = useOldLang();

  useHistoryBack({
    isActive,
    onBack: onReset,
  });

  return (
    <div className="settings-content settings-language custom-scroll">
      <div className="settings-item settings-item-picker">
        <h4 className="settings-item-header">
          {lang('Language')}
        </h4>
        <TelyAILanguageSelector />
      </div>
    </div>
  );
};

export default memo(TelyAILanguageContent);
