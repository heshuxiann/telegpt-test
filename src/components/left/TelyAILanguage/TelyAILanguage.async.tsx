import React from '@teact';
import type { FC } from '../../../lib/teact/teact';

import type { OwnProps } from './TelyAILanguage';

import { Bundles } from '../../../util/moduleLoader';

import useModuleLoader from '../../../hooks/useModuleLoader';

import Loading from '../../ui/Loading';

const TelyAILanguageAsync: FC<OwnProps> = (props) => {
  const TelyAILanguage = useModuleLoader(Bundles.Extra, 'TelyAILanguage');

  return TelyAILanguage ? <TelyAILanguage {...props} /> : <Loading />;
};

export default TelyAILanguageAsync;
