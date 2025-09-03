import React from '../../../../lib/teact/teact';

import { injectComponent } from '../../injectComponent';
import GuidanceCarousel from './guidance-carousel';

const GuidanceWrapper = ({ handleClose }: { handleClose: () => void }) => {
  const containerRef = injectComponent({
    component: GuidanceCarousel,
    props: {
      handleClose,
    },
  });
  return (
    <div ref={containerRef} />
  );
};

export default GuidanceWrapper;
