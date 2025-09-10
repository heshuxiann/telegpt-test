import React from '@teact';
import type { FC } from '../../../lib/teact/teact';

import type { OwnProps } from './InviteFriendsModal';

import { Bundles } from '../../../util/moduleLoader';

import useModuleLoader from '../../../hooks/useModuleLoader';

const InviteFriendsModalAsync: FC<OwnProps> = (props) => {
  const { modal } = props;
  const InviteFriendsModal = useModuleLoader(Bundles.Extra, 'InviteFriendsModal', !modal?.isOpen);

  return InviteFriendsModal ? <InviteFriendsModal {...props} /> : undefined;
};

export default InviteFriendsModalAsync;
