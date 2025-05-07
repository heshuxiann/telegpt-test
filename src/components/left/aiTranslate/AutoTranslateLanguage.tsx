import type { FC } from '../../../lib/teact/teact';
import React, {
  useEffect,
  useMemo, useState,
} from '../../../lib/teact/teact';
import { getActions } from '../../../global';

import { SUPPORTED_TRANSLATION_LANGUAGES } from '../../../config';
import { CHATAI_IDB_STORE } from '../../../util/browser/idb';
import buildClassName from '../../../util/buildClassName';

import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';

import ItemPicker, { type ItemPickerOption } from '../../common/pickers/ItemPicker';

import styles from './AutoTranslateLanguage.module.scss';

// https://fasttext.cc/docs/en/language-identification.html
const LOCAL_SUPPORTED_DETECTION_LANGUAGES = [
  'af', 'als', 'am', 'an', 'ar', 'arz', 'as', 'ast', 'av', 'az',
  'azb', 'ba', 'bar', 'bcl', 'be', 'bg', 'bh', 'bn', 'bo', 'bpy',
  'br', 'bs', 'bxr', 'ca', 'cbk', 'ce', 'ceb', 'ckb', 'co', 'cs',
  'cv', 'cy', 'da', 'de', 'diq', 'dsb', 'dty', 'dv', 'el', 'eml',
  'en', 'eo', 'es', 'et', 'eu', 'fa', 'fi', 'fr', 'frr', 'fy',
  'ga', 'gd', 'gl', 'gn', 'gom', 'gu', 'gv', 'he', 'hi', 'hif',
  'hr', 'hsb', 'ht', 'hu', 'hy', 'ia', 'id', 'ie', 'ilo', 'io',
  'is', 'it', 'ja', 'jbo', 'jv', 'ka', 'kk', 'km', 'kn', 'ko',
  'krc', 'ku', 'kv', 'kw', 'ky', 'la', 'lb', 'lez', 'li', 'lmo',
  'lo', 'lrc', 'lt', 'lv', 'mai', 'mg', 'mhr', 'min', 'mk', 'ml',
  'mn', 'mr', 'mrj', 'ms', 'mt', 'mwl', 'my', 'myv', 'mzn', 'nah',
  'nap', 'nds', 'ne', 'new', 'nl', 'nn', 'no', 'oc', 'or', 'os',
  'pa', 'pam', 'pfl', 'pl', 'pms', 'pnb', 'ps', 'pt', 'qu', 'rm',
  'ro', 'ru', 'rue', 'sa', 'sah', 'sc', 'scn', 'sco', 'sd', 'sh',
  'si', 'sk', 'sl', 'so', 'sq', 'sr', 'su', 'sv', 'sw', 'ta', 'te',
  'tg', 'th', 'tk', 'tl', 'tr', 'tt', 'tyv', 'ug', 'uk', 'ur', 'uz',
  'vec', 'vep', 'vi', 'vls', 'vo', 'wa', 'war', 'wuu', 'xal', 'xmf',
  'yi', 'yo', 'yue', 'zh',
];

const SUPPORTED_LANGUAGES = SUPPORTED_TRANSLATION_LANGUAGES.filter((lang: string) => (
  LOCAL_SUPPORTED_DETECTION_LANGUAGES.includes(lang)
));

const AutoTranslateLanguage: FC = () => {
  const { setSettingOption } = getActions();
  const lang = useOldLang();
  const language = lang.code || 'en';
  const [displayedOptions, setDisplayedOptions] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const displayedOptionList: ItemPickerOption[] = useMemo(() => {
    const options = SUPPORTED_LANGUAGES.map((langCode: string) => {
      const translatedNames = new Intl.DisplayNames([language], { type: 'language' });
      const translatedName = translatedNames.of(langCode)!;

      const originalNames = new Intl.DisplayNames([langCode], { type: 'language' });
      const originalName = originalNames.of(langCode)!;

      return {
        langCode,
        translatedName,
        originalName,
      };
    }).filter(Boolean).map(({ langCode, translatedName, originalName }) => ({
      label: translatedName,
      subLabel: originalName,
      value: langCode,
    }));

    if (!searchQuery.trim()) {
      const currentLanguageOption = options.find((option) => option.value === language);
      const otherOptionList = options.filter((option) => option.value !== language);
      return currentLanguageOption ? [currentLanguageOption, ...otherOptionList] : options;
    }

    return options?.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [language, searchQuery]);

  useEffect(() => {
    CHATAI_IDB_STORE.get('auto-translate-language').then((lan) => {
      setDisplayedOptions(lan as string || language);
    });
  }, [language]);

  const handleChange = useLastCallback((newSelectedIds: string) => {
    setDisplayedOptions(newSelectedIds);
    CHATAI_IDB_STORE.set('auto-translate-language', newSelectedIds);
    setSettingOption({
      autoTranslateLanguage: newSelectedIds,
      translationLanguage: newSelectedIds,
    });
  });

  return (
    <div className={buildClassName(styles.root, 'settings-content infinite-scroll')}>
      <div className={buildClassName(styles.item)}>
        <ItemPicker
          className={styles.picker}
          items={displayedOptionList}
          selectedValue={displayedOptions}
          onSelectedValueChange={handleChange}
          filterValue={searchQuery}
          onFilterChange={setSearchQuery}
          isSearchable={false}
          allowMultiple={false}
          withDefaultPadding
          itemInputType="radio"
          searchInputId="lang-picker-search"
        />
      </div>
    </div>
  );
};

export default AutoTranslateLanguage;
