import type { FC } from '../../../lib/teact/teact';
import React from '../../../lib/teact/teact';

import type { OwnProps } from './CreditLimitModal';

import { Bundles } from '../../../util/moduleLoader';

import useModuleLoader from '../../../hooks/useModuleLoader';

const CreditLimitModalAsync: FC<OwnProps> = (props) => {
  const { modal } = props;
  const CreditLimitModal = useModuleLoader(Bundles.Extra, 'CreditLimitModal', !modal);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return CreditLimitModal ? <CreditLimitModal {...props} /> : undefined;
};

export default CreditLimitModalAsync;
