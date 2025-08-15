import type { FC } from 'react';
import React from 'react';
import cx from 'classnames';

import './Spinner.scss';

const Spinner: FC<{
  color?: 'blue' | 'white' | 'black' | 'green' | 'gray' | 'yellow';
  backgroundColor?: 'light' | 'dark';
  className?: string;
}> = ({
  color = 'blue',
  backgroundColor,
  className,
}) => {
  return (
    <div className={cx(
      'Spinner-GPT', className, color, backgroundColor && 'with-background', backgroundColor && `bg-${backgroundColor}`,
    )}
    >
      <div className="Spinner__inner" />
    </div>
  );
};

export default Spinner;
