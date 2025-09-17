import React from '@teact';
import { memo } from '../../../../lib/teact/teact';
import { getActions } from '../../../../global';

import './UpgradeButton.scss';
const UpgradeButton = () => {
  const handleUpgrade = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    getActions().openPayPackageModal();
  };
  return (
    <div className="upgrade-button" onClick={handleUpgrade}>
      Upgrade
    </div>
  );
};

export default memo(UpgradeButton);
