/* eslint-disable no-null/no-null */

import React, { useRef } from 'react';
import { Carousel } from 'antd';
import type { CarouselRef } from 'antd/es/carousel';
import cx from 'classnames';

import buildClassName from '../../../../util/buildClassName';
import { CloseIcon } from '../../icons';

import styles from './guidance.module.scss';

const CarouselItem = ({ className, children }: { className: string; children?: React.ReactNode }) => {
  return (
    <div className={cx('guidance-carousel-item', className)}>
      <div className="px-[40px] h-full w-full flex items-center">
        {children}
      </div>
    </div>
  );
};
const GuidanceCarousel = ({ handleClose }: { handleClose: () => void }) => {
  const carouselRef = useRef<CarouselRef>(null);
  const handleNextClick = (step: number) => {
    carouselRef.current?.goTo(step);
    if (step === 4) {
      handleClose();
    }
  };
  return (
    <div>
      <div className="guidance-bubble" />
      <div className="absolute top-[10px] right-[10px] cursor-pointer text-[#A89E9E] z-10" onClick={handleClose}>
        <CloseIcon size={24} />
      </div>
      <Carousel className={buildClassName('guidance-carousel', styles.guidanceCarouselBg)} ref={carouselRef}>
        <CarouselItem className="guidance-summary">
          <div className="flex flex-col w-2/5  pt-[5%] pb-[12%] text-[var(--color-text)]">
            <div className="text-[45px] font-bold leading-[44px] mb-[20px]">Chat Summary</div>
            <div className="text-[14px]">
              Message Summarization uses AI to extract key points from IM chats and provide regular summaries, helping users stay updated.
            </div>
            <div className="guidance-carousel-next" onClick={() => handleNextClick(1)}>Next</div>
          </div>
          <div className="pt-[20px] pb-[50px] h-full w-3/5">
            <div className={buildClassName('h-full w-full', styles.guidanceSummaryBg)}></div>
          </div>
        </CarouselItem>
        <CarouselItem className="guidance-translation">
          <div className="flex flex-col w-2/5  pt-[5%] pb-[12%] text-[var(--color-text)]">
            <div className="text-[45px] font-bold leading-[44px] mb-[20px]">Translation & Grammar Check</div>
            <div className="text-[14px]">
              Instant Translation: Real-time translation with auto language detection.
              Error Detection: Spots spelling, grammar, and structure issues.
            </div>
            <div className="guidance-carousel-next" onClick={() => handleNextClick(2)}>Next</div>
          </div>
          <div className="pt-[20px] pb-[50px] h-full w-3/5">
            <div className={buildClassName('h-full w-full', styles.guidanceTranslationBg)}></div>
          </div>
        </CarouselItem>
        <CarouselItem className="guidance-meeting">
          <div className="flex flex-col w-2/5  pt-[5%] pb-[12%] text-[var(--color-text)]">
            <div className="text-[45px] font-bold leading-[44px] mb-[20px]">Meeting Scheduler</div>
            <div className="text-[14px]">
              Automatically detects meeting chats, gathers details, and sends calendar invites—all within the conversation.
            </div>
            <div className="guidance-carousel-next" onClick={() => handleNextClick(3)}>Next</div>
          </div>
          <div className="pt-[20px] pb-[50px] h-full w-3/5">
            <div className={buildClassName('h-full w-full', styles.guidanceMeetingBg)}></div>
          </div>
        </CarouselItem>
        <CarouselItem className="guidance-actions">
          <div className="flex flex-col w-2/5  pt-[5%] pb-[12%] text-[var(--color-text)]">
            <div className="text-[45px] font-bold leading-[44px] mb-[20px]">Action Items</div>
            <div className="text-[14px]">
              AI picks out tasks and follow-ups from chats in real time—no manual notes needed.
            </div>
            <div className="guidance-carousel-next" onClick={() => handleNextClick(4)}>Next</div>
          </div>
          <div className="pt-[20px] pb-[50px] h-full w-3/5">
            <div className={buildClassName('h-full w-full', styles.guidanceActionsBg)}></div>
          </div>
        </CarouselItem>
      </Carousel>
    </div>
  );
};

export default GuidanceCarousel;
