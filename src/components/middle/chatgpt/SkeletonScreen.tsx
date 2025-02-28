import React from '../../../lib/teact/teact';

import './SkeletonScreen.scss';

const SkeletonScreen = () => {
  return (
    <div className="skeleton-wrapper">
      <div className="skeleton-text skeleton-line" />
      <div className="skeleton-text skeleton-line" />
      <div className="skeleton-text skeleton-line" />
    </div>
  );
};

export default SkeletonScreen;
