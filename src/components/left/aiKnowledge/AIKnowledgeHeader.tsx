import React from '@teact';
/* eslint-disable max-len */
import type { FC } from '../../../lib/teact/teact';
import { memo, useCallback } from '../../../lib/teact/teact';

import useOldLang from '../../../hooks/useOldLang';

import Icon from '../../common/icons/Icon';
import Button from '../../ui/Button';

type OwnProps = {
  showAddButton:boolean;
  onReset: () => void;
  onShowAddModal:(type:'edit' | 'add') => void;
};
const AIKnowledgeHeader: FC<OwnProps> = ({ onReset, showAddButton, onShowAddModal }) => {
  const oldLang = useOldLang();

  function renderHeaderContent() {
    return <h3>{oldLang('Quick Replies')}</h3>;
  }
  const handleAdd = useCallback(() => {
    onShowAddModal('add');
  }, [onShowAddModal]);
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
      {showAddButton && (
        <Button
          round
          color="translucent"
          className="!bg-[#8C42F0] flex flex-row items-center gap-[8px] !w-[92px] !h-[30px] !p-0 !rounded-[21px] !text-[14px]"
          onClick={handleAdd}
        >
          <Icon className="text-white text-[14px]" name="add" />
          <span className="text-white">Add</span>
        </Button>
      )}
    </div>
  );
};

export default memo(AIKnowledgeHeader);
