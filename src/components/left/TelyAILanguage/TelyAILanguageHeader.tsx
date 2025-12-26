import React from '@teact';
/* eslint-disable max-len */
import type { FC } from '../../../lib/teact/teact';
import { memo } from '../../../lib/teact/teact';

import useOldLang from '../../../hooks/useOldLang';

import Icon from '../../common/icons/Icon';
import Button from '../../ui/Button';

type OwnProps = {
  onReset: () => void;
};
const TelyAILanguageHeader: FC<OwnProps> = ({ onReset }) => {
  const oldLang = useOldLang();

  function renderHeaderContent() {
    return <h3>{oldLang('TelyAI Language')}</h3>;
  }
  return (
    <div className="left-header">
      <Button
        round
        size="smaller"
        color="translucent"
        onClick={onReset}
        ariaLabel={oldLang('AccDescrGoBack')}
      >
        <Icon name="arrow-left" />
      </Button>
      {renderHeaderContent()}
    </div>
  );
};

export default memo(TelyAILanguageHeader);
