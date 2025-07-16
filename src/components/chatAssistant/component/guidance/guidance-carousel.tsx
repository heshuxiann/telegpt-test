/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, { useRef } from 'react';
import { Carousel } from 'antd';
import type { CarouselRef } from 'antd/es/carousel';
import cx from 'classnames';

import { CloseIcon } from '../../icons';

import './guidance.scss';

const CarouselItem = ({ className, children }:{ className:string;children?:React.ReactNode }) => {
  return (
    <div className={cx('guidance-carousel-item', className)}>
      <div className="w-[42%] pl-[50px] pt-[5%] pb-[12%] h-full flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
};
const GuidanceCarousel = ({ handleClose }:{ handleClose:()=>void }) => {
  const carouselRef = useRef<CarouselRef>(null);
  const handleNextClick = (step:number) => {
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
      <Carousel className="guidance-carousel" ref={carouselRef}>
        <CarouselItem className="guidance-summary">
          <div className="text-[45px] font-bold leading-[44px] mb-[20px]">Chat Summary</div>
          <div className="text-[14px]">
            Message Summarization uses AI to extract key points from IM chats and provide regular summaries, helping users stay updated.
          </div>
          <div className="guidance-carousel-next" onClick={() => handleNextClick(1)}>Next</div>
        </CarouselItem>
        <CarouselItem className="guidance-translation">
          <div className="text-[45px] font-bold leading-[44px] mb-[20px]">Translation & Grammar Check</div>
          <div className="text-[14px]">
            Instant Translation: Real-time translation with auto language detection.
            Error Detection: Spots spelling, grammar, and structure issues.
          </div>
          <div className="guidance-carousel-next" onClick={() => handleNextClick(2)}>Next</div>
        </CarouselItem>
        <CarouselItem className="guidance-meeting">
          <div className="text-[45px] font-bold leading-[44px] mb-[20px]">Meeting Scheduler</div>
          <div className="text-[14px]">
            Automatically detects meeting chats, gathers details, and sends calendar invites—all within the conversation.
          </div>
          <div className="guidance-carousel-next" onClick={() => handleNextClick(3)}>Next</div>
        </CarouselItem>
        <CarouselItem className="guidance-actions">
          <div className="text-[45px] font-bold leading-[44px] mb-[20px]">Action Items</div>
          <div className="text-[14px]">
            AI picks out tasks and follow-ups from chats in real time—no manual notes needed.
          </div>
          <div className="guidance-carousel-next" onClick={() => handleNextClick(4)}>Next</div>
        </CarouselItem>
      </Carousel>
    </div>
  );
};

export default GuidanceCarousel;
