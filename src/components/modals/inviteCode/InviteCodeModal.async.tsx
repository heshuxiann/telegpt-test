import type { FC } from '../../../lib/teact/teact';
import React from '../../../lib/teact/teact';

import type { OwnProps } from './InviteCodeModal';

import { Bundles } from '../../../util/moduleLoader';

import useModuleLoader from '../../../hooks/useModuleLoader';

const InviteCodeModalAsync: FC<OwnProps> = (props) => {
  const InviteCodeModal = useModuleLoader(Bundles.Extra, 'InviteCodeModal');

  return InviteCodeModal ? <InviteCodeModal {...props} /> : undefined;
};

export default InviteCodeModalAsync;
