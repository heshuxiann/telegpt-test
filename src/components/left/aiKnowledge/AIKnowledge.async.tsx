import type { FC } from '../../../lib/teact/teact';
import React from '../../../lib/teact/teact';

import type { OwnProps } from './AIKnowledge';

import { Bundles } from '../../../util/moduleLoader';

import useModuleLoader from '../../../hooks/useModuleLoader';

import Loading from '../../ui/Loading';

const AIKnowledgeAsync: FC<OwnProps> = (props) => {
  const AIKnowledge = useModuleLoader(Bundles.Extra, 'AIKnowledge');

  // eslint-disable-next-line react/jsx-props-no-spreading
  return AIKnowledge ? <AIKnowledge {...props} /> : <Loading />;
};

export default AIKnowledgeAsync;
