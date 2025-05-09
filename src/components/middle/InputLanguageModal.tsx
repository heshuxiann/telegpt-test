import type { FC } from '../../lib/teact/teact';
import React, {
  useEffect, useMemo, useState,
} from '../../lib/teact/teact';

import { SUPPORTED_TRANSLATION_LANGUAGES } from '../../config';
import { CHATAI_IDB_STORE } from '../../util/browser/idb';
import buildClassName from '../../util/buildClassName';
import renderText from '../common/helpers/renderText';

import useLastCallback from '../../hooks/useLastCallback';
import useOldLang from '../../hooks/useOldLang';

import InputText from '../ui/InputText';
import ListItem from '../ui/ListItem';
import Modal from '../ui/Modal';

import styles from './ChatLanguageModal.module.scss';

type LanguageItem = {
  langCode: string;
  translatedName: string;
  originalName: string;
};

export type OwnProps = {
  isOpen?: boolean;
  closeInputLanguageModal: () => void;
};

const InputLanguageModal: FC<OwnProps> = ({
  isOpen,
  closeInputLanguageModal,
}) => {
  const [search, setSearch] = useState('');
  const lang = useOldLang();
  const [currentLanguageCode, setCurrentLanguageCode] = useState('en');

  useEffect(() => {
    if (isOpen) {
      CHATAI_IDB_STORE.get('input-translate-language').then((language:any) => {
        setCurrentLanguageCode(language ? language as string : 'en');
      });
    }
  }, [isOpen]);

  const handleSelect = useLastCallback((langCode: string) => {
    // eslint-disable-next-line no-console
    console.log(langCode);
    CHATAI_IDB_STORE.set('input-translate-language', langCode);

    closeInputLanguageModal();
  });

  const handleSearch = useLastCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  });

  const translateLanguages = useMemo(() => SUPPORTED_TRANSLATION_LANGUAGES.map((langCode: string) => {
    const translatedNames = new Intl.DisplayNames([currentLanguageCode], { type: 'language' });
    const translatedName = translatedNames.of(langCode)!;

    const originalNames = new Intl.DisplayNames([langCode], { type: 'language' });
    const originalName = originalNames.of(langCode)!;

    return {
      langCode,
      translatedName,
      originalName,
    } satisfies LanguageItem;
  }), [currentLanguageCode]);

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
        teactExperimentControlled
      />
      <div className={buildClassName(styles.languages, 'custom-scroll')}>
        {filteredDisplayedLanguages.map(({ langCode, originalName, translatedName }) => (
          <ListItem
            key={langCode}
            className={buildClassName(styles.listItem, 'no-icon')}
            secondaryIcon={currentLanguageCode === langCode ? 'check' : undefined}
            disabled={currentLanguageCode === langCode}
            multiline
            narrow
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
