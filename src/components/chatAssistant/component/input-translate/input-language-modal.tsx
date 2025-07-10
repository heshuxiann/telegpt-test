import type { FC } from '../../../../lib/teact/teact';
import React, {
  useEffect, useMemo, useState,
} from '../../../../lib/teact/teact';

import { SUPPORTED_TRANSLATION_LANGUAGES } from '../../../../config';
import buildClassName from '../../../../util/buildClassName';
import renderText from '../../../common/helpers/renderText';

import useLastCallback from '../../../../hooks/useLastCallback';
import useOldLang from '../../../../hooks/useOldLang';

import InputText from '../../../ui/InputText';
import ListItem from '../../../ui/ListItem';
import Modal from '../../../ui/Modal';

import styles from './input-language.module.scss';

type LanguageItem = {
  langCode: string;
  translatedName: string;
  originalName: string;
};

export type OwnProps = {
  isOpen?: boolean;
  translateLanguage: string | undefined;
  closeInputLanguageModal: () => void;
  updateTranslateLanguage: (langCode: string | undefined) => void;
};

const InputLanguageModal: FC<OwnProps> = ({
  isOpen,
  translateLanguage,
  closeInputLanguageModal,
  updateTranslateLanguage,
}) => {
  const [search, setSearch] = useState('');
  const lang = useOldLang();
  const handleSelect = useLastCallback((langCode: string) => {
    if (langCode === translateLanguage) {
      updateTranslateLanguage(undefined);
    } else {
      updateTranslateLanguage(langCode);
    }

    closeInputLanguageModal();
  });

  const handleSearch = useLastCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  });

  const translateLanguages = useMemo(() => SUPPORTED_TRANSLATION_LANGUAGES.map((langCode: string) => {
    const translatedNames = new Intl.DisplayNames([translateLanguage || 'en'], { type: 'language' });
    const translatedName = translatedNames.of(langCode)!;

    const originalNames = new Intl.DisplayNames([langCode], { type: 'language' });
    const originalName = originalNames.of(langCode)!;

    return {
      langCode,
      translatedName,
      originalName,
    } satisfies LanguageItem;
  }), [translateLanguage]);

  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const filteredDisplayedLanguages = useMemo(() => {
    if (!search.trim()) {
      return translateLanguages;
    }

    return translateLanguages.filter(({ langCode, translatedName, originalName }) => (
      translatedName.toLowerCase().includes(search.toLowerCase())
      || originalName.toLowerCase().includes(search.toLowerCase())
      || langCode.toLowerCase().includes(search.toLowerCase())
    ));
  }, [translateLanguages, search]);

  return (
    <Modal
      className={styles.root}
      isSlim
      isOpen={isOpen}
      hasCloseButton
      title={lang('Language')}
      onClose={closeInputLanguageModal}
    >
      <InputText
        key="search"
        value={search}
        onChange={handleSearch}
        placeholder={lang('Search')}
        // teactExperimentControlled
      />
      <div className={buildClassName(styles.languages, 'custom-scroll')}>
        {filteredDisplayedLanguages.map(({ langCode, originalName, translatedName }) => (
          <ListItem
            key={langCode}
            className={buildClassName(styles.listItem, 'no-icon')}
            secondaryIcon={translateLanguage === langCode ? 'check' : undefined}
            disabled={translateLanguage === langCode}
            multiline
            narrow
            allowDisabledClick
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => handleSelect(langCode)}
          >
            <span className={buildClassName('title', styles.title)}>
              {renderText(originalName, ['highlight'], { highlight: search })}
            </span>
            <span className={buildClassName('subtitle', styles.subtitle)}>
              {renderText(translatedName, ['highlight'], { highlight: search })}
            </span>
          </ListItem>
        ))}
      </div>
    </Modal>
  );
};

export default InputLanguageModal;
