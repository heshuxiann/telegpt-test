import React, { useMemo } from '@teact';
import { getActions, withGlobal } from '../../../../global';

import './UpgradeButton.scss';

interface StateProps {
  subscriptionInfo: any;
}
const UpgradeButton = ({ subscriptionInfo }: StateProps) => {
  const handleUpgrade = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    getActions().openPayPackageModal();
  };
  const subscriptionType = useMemo(() => {
    switch (subscriptionInfo?.subscriptionType) {
      case 'basic':
        return 'Basic';
      case 'pro':
        return 'Pro';
      case 'plus':
        return 'Plus';
      default:
        return 'Upgrade';
    }
  }, [subscriptionInfo]);
  return (
    <div className="upgrade-button" onClick={handleUpgrade}>
      {subscriptionType}
    </div>
  );
};

export default withGlobal(
  (global): StateProps => {
    const subscriptionInfo = global.subscriptionInfo;
    return {
      subscriptionInfo,
    };
  },
)(UpgradeButton);
