/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
import type { CSSProperties } from 'react';
import React, { memo, useRef } from 'react';
import { Popover } from 'antd';

export type OwnProps = {
  top: number;
  left: number;
  width: number;
  height: number;
  replacement:string;
  generalErrorType: string;
  errorIndex?: number;
  handleFixError:(errorIndex:number)=>void;
};

const TooltipContent = (
  {
    replacement,
    errorIndex,
    handleFixError,
  }:
  { replacement:string;
    errorIndex:number;
    handleFixError:(errorIndex:number)=>void;
  },
) => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const handleClick = () => {
    handleFixError(errorIndex);
  };
  return (
    <div className="InputErrorTooltip__content">
      <div>ReplaceMent</div>
      <div
        className="px-[12px] py-[10px] rounded-[8px] cursor-pointer hover:bg-[#F4F4F5]"
        onClick={handleClick}
      >
        {replacement}
      </div>
    </div>
  );
};

const InputErrorTooltip = (props: OwnProps) => {
  const {
    top, left, width, height, replacement, generalErrorType, errorIndex, handleFixError,
  } = props;
  const triggerRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className="absolute"
      style={{
        left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`,
      } as CSSProperties}
    >
      <Popover
        placement="top"
        content={(
          <TooltipContent
            replacement={replacement}
            errorIndex={errorIndex!!}
            handleFixError={handleFixError}
          />
        )}
      >
        <div
          ref={triggerRef}
          className={`h-full w-full border-b-[2px] ${generalErrorType.toLocaleLowerCase() === 'typos' ? 'border-red-500/60' : 'border-[#FFD633]'}`}
        />
      </Popover>
    </div>
  );
};

export default memo(InputErrorTooltip);
