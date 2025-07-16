/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-null/no-null */
import React, {
  useEffect,
  useRef,
} from '../../../../lib/teact/teact';

import { injectComponent } from '../../../../lib/injectComponent';
import GuidanceCarousel from './guidance-carousel';

const injectMessageAI = injectComponent(GuidanceCarousel);
const GuidanceWrapper = ({ handleClose }:{ handleClose:()=>void }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (containerRef.current) {
      injectMessageAI(containerRef.current, { handleClose });
    }
  }, [handleClose]);
  return (
    <div ref={containerRef} />
  );
};

export default GuidanceWrapper;
