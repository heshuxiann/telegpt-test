import React from '@teact';
import type { FC } from '../../../lib/teact/teact';

import type { OwnProps } from './CreditsModal';

import { Bundles } from '../../../util/moduleLoader';

import useModuleLoader from '../../../hooks/useModuleLoader';

const CreditsModalAsync: FC<OwnProps> = (props) => {
  const { modal } = props;
  const CreditsModal = useModuleLoader(Bundles.Extra, 'CreditsModal', !modal?.isOpen);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return CreditsModal ? <CreditsModal {...props} /> : undefined;
};

export default CreditsModalAsync;
