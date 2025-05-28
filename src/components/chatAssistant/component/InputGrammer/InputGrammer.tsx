import React from 'react';

import InputErrorTooltip from './InputErrorTooltip';

export type ErrorsMarkers = {
  left: number;
  top: number;
  width: number;
  height: number;
  start: number;
  end: number;
  replacements: string[];
}[];
export interface InputGrammerProps {
  errorMarkers:ErrorsMarkers;
  handleFixError:({ start, end, replacement }:{ start: number; end: number; replacement: string })=>void;
}
const InputGrammer = (props:InputGrammerProps) => {
  const { errorMarkers, handleFixError } = props;
  return (
    <div className="absolute left-0 top-0">
      {errorMarkers.map((item, index) => {
        return (
          <InputErrorTooltip
            left={item.left}
            top={item.top}
            width={item.width}
            height={item.height}
            replacements={item.replacements}
            start={item.start}
            end={item.end}
            errorIndex={index}
            handleFixError={handleFixError}
          />
        );
      })}
    </div>
  );
};

export default InputGrammer;
