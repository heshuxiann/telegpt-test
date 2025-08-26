import type { FC } from '../../../lib/teact/teact';
import React from '@teact';

import type { OwnProps } from './AITranslate';

import { Bundles } from '../../../util/moduleLoader';

import useModuleLoader from '../../../hooks/useModuleLoader';

import Loading from '../../ui/Loading';

const AITranslateAsync: FC<OwnProps> = (props) => {
  const AITranslate = useModuleLoader(Bundles.Extra, 'AITranslate');

  // eslint-disable-next-line react/jsx-props-no-spreading
  return AITranslate ? <AITranslate {...props} /> : <Loading />;
};

export default AITranslateAsync;
