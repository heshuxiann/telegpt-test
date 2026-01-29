import type { FC } from '../../../lib/teact/teact';
import React from '../../../lib/teact/teact';

import type { OwnProps } from './PayPackageModal';

import { Bundles } from '../../../util/moduleLoader';

import useModuleLoader from '../../../hooks/useModuleLoader';

const PayPackageModalAsync: FC<OwnProps> = (props) => {
  const { modal } = props;
  const PayPackageModal = useModuleLoader(Bundles.Extra, 'PayPackageModal', !modal?.isOpen);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return PayPackageModal ? <PayPackageModal {...props} /> : undefined;
};

export default PayPackageModalAsync;
