import type { FC } from '../../../../lib/teact/teact';
import React, {
  useEffect, useMemo, useState,
} from '../../../../lib/teact/teact';

import { SUPPORTED_TRANSLATION_LANGUAGES } from '../../../../config';
import buildClassName from '../../../../util/buildClassName';
import renderText from '../../../common/helpers/renderText';

import useLastCallback from '../../../../hooks/useLastCallback';
import useOldLang from '../../../../hooks/useOldLang';

import Icon from '../../../common/icons/Icon';
import Button from '../../../ui/Button';
import InputText from '../../../ui/InputText';
import ListItem from '../../../ui/ListItem';
import Modal from '../../../ui/Modal';
import Switcher from '../../../ui/Switcher';

import styles from './input-language.module.scss';

type LanguageItem = {
  langCode: string;
  translatedName: string;
  originalName: string;
};

export type OwnProps = {
  isOpen?: boolean;
  inputTranslateOptions: {
    translateLanguage: string;
    autoTranslate: boolean;
    firstTime: boolean;
  };
  closeInputLanguageModal: () => void;
  updateRoomInputTranslateOptions: (options: {
    translateLanguage: string;
    autoTranslate: boolean;
    firstTime: boolean;
  }) => void;
};

const InputLanguageHeader = ({ onClose, inputTranslateOptions, handleAutoTranslateChange }: {
  onClose: () => void;
  inputTranslateOptions: OwnProps['inputTranslateOptions'];
  handleAutoTranslateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <div className="modal-header">
      <Button
        round
        color="translucent"
        size="smaller"
        ariaLabel="Close"
        onClick={onClose}
      >
        <Icon name="close" />
      </Button>
      <div className="modal-title pr-[4px] h-[44px] flex items-center justify-between">
        <span>Language</span>
        <Switcher
          label="Toggle Chat Translate"
          checked={inputTranslateOptions.autoTranslate}
          onChange={handleAutoTranslateChange}
        />
      </div>
    </div>
  );
};

const InputLanguageModal: FC<OwnProps> = ({
  isOpen,
  inputTranslateOptions,
  closeInputLanguageModal,
  updateRoomInputTranslateOptions,
}) => {
  const [search, setSearch] = useState('');
  const lang = useOldLang();
  const handleSelect = useLastCallback((langCode: string) => {
    inputTranslateOptions.translateLanguage = langCode;
    inputTranslateOptions.firstTime = false;
    updateRoomInputTranslateOptions(inputTranslateOptions);
    // 打开自动翻译开关
    inputTranslateOptions.autoTranslate = true;
    inputTranslateOptions.firstTime = false;
    updateRoomInputTranslateOptions(inputTranslateOptions);
    closeInputLanguageModal();
  });

  const handleSearch = useLastCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  });

  const handleAutoTranslateChange = useLastCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    inputTranslateOptions.autoTranslate = e.target.checked;
    inputTranslateOptions.firstTime = false;
    updateRoomInputTranslateOptions(inputTranslateOptions);
  });

  const translateLanguages = useMemo(() => SUPPORTED_TRANSLATION_LANGUAGES.map((langCode: string) => {
    const translatedNames = new Intl.DisplayNames([inputTranslateOptions.translateLanguage || 'en'], { type: 'language' });
    const translatedName = translatedNames.of(langCode)!;

    const originalNames = new Intl.DisplayNames([langCode], { type: 'language' });
    const originalName = originalNames.of(langCode)!;

    return {
      langCode,
      translatedName,
      originalName,
    } satisfies LanguageItem;
  }), [inputTranslateOptions]);

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
      header={(
        <InputLanguageHeader
          onClose={closeInputLanguageModal}
          inputTranslateOptions={inputTranslateOptions}
          handleAutoTranslateChange={handleAutoTranslateChange}
        />
      )}
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
            secondaryIcon={inputTranslateOptions.translateLanguage === langCode ? 'check' : undefined}
            disabled={inputTranslateOptions.translateLanguage === langCode}
            multiline
            narrow
            allowDisabledClick
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
