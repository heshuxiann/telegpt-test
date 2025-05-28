/* eslint-disable no-null/no-null */
import type { CSSProperties } from 'react';
import React, { memo, useRef } from 'react';
import { Popover } from 'antd';

export type OwnProps = {
  top: number;
  left: number;
  width: number;
  height: number;
  start: number;
  end: number;
  replacements:string[];
  errorIndex?: number;
  handleFixError:({ start, end, replacement }:{ start: number; end: number; replacement: string })=>void;
};

const TooltipContent = (
  {
    replacements,
    start,
    end,
    errorIndex,
    handleFixError,
  }:
  { replacements:string[];
    start:number;
    end:number;
    errorIndex:number;
    handleFixError:({
      start, end, replacement, errorIndex,
    }:{ start: number; end: number; replacement: string; errorIndex:number })=>void;
  },
) => {
  const handleClick = (replacement:string) => {
    handleFixError({
      start, end, replacement, errorIndex,
    });
  };
  return (
    <div className="InputErrorTooltip__content">
      <div>ReplaceMents</div>
      {replacements.map((replacement) => (
        <div
          className="px-[12px] py-[10px] rounded-[8px] cursor-pointer hover:bg-[#F4F4F5]"
          onClick={() => handleClick(replacement)}
        >
          {replacement}
        </div>
      ))}
    </div>
  );
};

const InputErrorTooltip = (props: OwnProps) => {
  const {
    top, left, width, height, start, end, replacements, errorIndex, handleFixError,
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
            replacements={replacements}
            start={start}
            end={end}
            errorIndex={errorIndex!!}
            handleFixError={handleFixError}
          />
        )}
      >
        <div
          ref={triggerRef}
          className="h-full w-full border-b-[2px] border-red-500/60"
        />
      </Popover>
    </div>
  );
};

export default memo(InputErrorTooltip);
