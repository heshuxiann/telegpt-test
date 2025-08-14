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
    <div className="text-[var(--color-text)]">
      <div>ReplaceMent</div>
      <div
        className="max-w-[min(30vw,400px)] px-[12px] py-[10px] rounded-[8px] cursor-pointer hover:bg-[var(--color-primary)] hover:text-white"
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
      className="absolute pointer-events-none"
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
          className={`absolute bottom-[-2px] h-[6px] w-full border-b-[2px] pointer-events-auto ${generalErrorType.toLocaleLowerCase() === 'typos' ? 'border-red-500/60' : 'border-[#FFD633]'}`}
        />
      </Popover>
    </div>
  );
};

export default memo(InputErrorTooltip);
