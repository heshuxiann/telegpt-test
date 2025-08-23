import type React from '../../../lib/teact/teact';
import { Modal } from 'antd';
import { memo, useMemo ,useCallback ,useState ,useEffect } from '../../../lib/teact/teact';
import { getActions, withGlobal, getGlobal } from '../../../global';

import type { ApiUser } from '../../../api/types';
import type { GlobalState } from '../../../global/types';
import type { AnimationLevel, ThemeKey } from '../../../types';

import {
  ANIMATION_LEVEL_MAX,
  ANIMATION_LEVEL_MIN,
  ARCHIVED_FOLDER_ID,
  BETA_CHANGELOG_URL,
  FEEDBACK_URL,
  IS_BETA,
  IS_TEST,
  PRODUCTION_HOSTNAME,
  WEB_VERSION_BASE,
} from '../../../config';
import {
  INITIAL_PERFORMANCE_STATE_MAX,
  INITIAL_PERFORMANCE_STATE_MED,
  INITIAL_PERFORMANCE_STATE_MIN,
} from '../../../global/initialState';
import { selectTabState, selectTheme, selectUser } from '../../../global/selectors';
import { selectPremiumLimit } from '../../../global/selectors/limits';
import { selectSharedSettings } from '../../../global/selectors/sharedState';
import { IS_MULTIACCOUNT_SUPPORTED } from '../../../util/browser/globalEnvironment';
import { IS_ELECTRON } from '../../../util/browser/windowEnvironment';
import buildClassName from '../../../util/buildClassName';
import buildStyle from '../../../util/buildStyle';
import { getPromptInstall } from '../../../util/installPrompt';
import { switchPermanentWebVersion } from '../../../util/permanentWebVersion';
import { AIChatFolderStep } from '../../chatAssistant/ai-chatfolders/ai-chatfolders-tip';
import { deleteAiChatFoldersFromUser, hideTip } from '../../chatAssistant/ai-chatfolders/util';
import { aiChatFoldersTask } from '../../chatAssistant/ai-task/ai-chatfolders-task';
import AIChatFolderIcon from '../../chatAssistant/assets/ai-chat-folder.png';
import AIKnowledgeIcon from '../../chatAssistant/assets/ai-knowledge.png';
import AITranslateIcon from '../../chatAssistant/assets/ai-translate.png';
import { ChataiStores, GLOBAL_AICHATFOLDERS_TIP_SHOW } from '../../chatAssistant/store';

import { useFolderManagerForUnreadCounters } from '../../../hooks/useFolderManager';
import useLang from '../../../hooks/useLang';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';

import eventEmitter, { Actions } from '../../chatAssistant/lib/EventEmitter';
import AttachBotItem from '../../middle/composer/AttachBotItem';
import MenuItem from '../../ui/MenuItem';
import MenuSeparator from '../../ui/MenuSeparator';
import Spinner from '../../ui/Spinner';
import Switcher from '../../ui/Switcher';
import Toggle from '../../ui/Toggle';
import AccountMenuItems from './AccountMenuItems';

type OwnProps = {
  onSelectAIKnowledge: NoneToVoidFunction;
  onSelectAITranslate: NoneToVoidFunction;
  onSelectSettings: NoneToVoidFunction;
  onSelectContacts: NoneToVoidFunction;
  onSelectArchived: NoneToVoidFunction;
  onBotMenuOpened: NoneToVoidFunction;
  onBotMenuClosed: NoneToVoidFunction;
};

type StateProps = {
  animationLevel: AnimationLevel;
  theme: ThemeKey;
  canInstall?: boolean;
  attachBots: GlobalState['attachMenu']['bots'];
  currentUser?: ApiUser;
  accountsTotalLimit: number;
  aiChatFolders?: boolean;
} & Pick<GlobalState, 'currentUserId' | 'archiveSettings'>;

const LeftSideMenuItems = ({
  currentUserId,
  archiveSettings,
  animationLevel,
  theme,
  canInstall,
  attachBots,
  currentUser,
  accountsTotalLimit,
  aiChatFolders,
  onSelectArchived,
  onSelectContacts,
  onSelectSettings,
  onBotMenuOpened,
  onBotMenuClosed,
  onSelectAIKnowledge,
  onSelectAITranslate,
}: OwnProps & StateProps) => {
  const {
    openChat,
    setSharedSettingOption,
    updatePerformanceSettings,
    openChatByUsername,
    openUrl,
    openChatWithInfo,
  } = getActions();
  const oldLang = useOldLang();
  const lang = useLang();

  const animationLevelValue = animationLevel !== ANIMATION_LEVEL_MIN
    ? (animationLevel === ANIMATION_LEVEL_MAX ? 'max' : 'mid') : 'min';

  const withOtherVersions = !IS_ELECTRON && (window.location.hostname === PRODUCTION_HOSTNAME || IS_TEST);

  const archivedUnreadChatsCount = useFolderManagerForUnreadCounters()[ARCHIVED_FOLDER_ID]?.chatsCount || 0;

  const bots = useMemo(() => Object.values(attachBots).filter((bot) => bot.isForSideMenu), [attachBots]);

  const handleSelectMyProfile = useLastCallback(() => {
    openChatWithInfo({ id: currentUserId, shouldReplaceHistory: true, profileTab: 'stories' });
  });

  const handleSelectSaved = useLastCallback(() => {
    openChat({ id: currentUserId, shouldReplaceHistory: true });
  });

  const handleDarkModeToggle = useLastCallback((e: React.SyntheticEvent<HTMLElement>) => {
    e.stopPropagation();
    const newTheme = theme === 'light' ? 'dark' : 'light';

    setSharedSettingOption({ theme: newTheme });
    setSharedSettingOption({ shouldUseSystemTheme: false });
  });

  const handleAnimationLevelChange = useLastCallback((e: React.SyntheticEvent<HTMLElement>) => {
    e.stopPropagation();

    let newLevel = animationLevel + 1;
    if (newLevel > ANIMATION_LEVEL_MAX) {
      newLevel = ANIMATION_LEVEL_MIN;
    }
    const performanceSettings = newLevel === ANIMATION_LEVEL_MIN
      ? INITIAL_PERFORMANCE_STATE_MIN
      : (newLevel === ANIMATION_LEVEL_MAX ? INITIAL_PERFORMANCE_STATE_MAX : INITIAL_PERFORMANCE_STATE_MED);

    setSharedSettingOption({ animationLevel: newLevel as AnimationLevel, wasAnimationLevelSetManually: true });
    updatePerformanceSettings(performanceSettings);
  });

  const handleChangelogClick = useLastCallback(() => {
    window.open(BETA_CHANGELOG_URL, '_blank', 'noopener');
  });

  const handleSwitchToWebK = useLastCallback(() => {
    switchPermanentWebVersion('K');
  });

  const handleOpenTipsChat = useLastCallback(() => {
    openChatByUsername({ username: oldLang('Settings.TipsUsername') });
  });

  const handleBugReportClick = useLastCallback(() => {
    openUrl({ url: FEEDBACK_URL });
  });

  const handleOpenMyStories = useLastCallback(() => {
    openChatWithInfo({ id: currentUserId, shouldReplaceHistory: true, profileTab: 'stories' });
  });

  const [aiChatFoldersLoading, setAiChatFoldersLoading] = useState<boolean>(false);
  const handleSwitchAIChatFolders = useLastCallback(async (e: React.SyntheticEvent<HTMLElement>) => {
    if (aiChatFoldersLoading) return;
    e.stopPropagation();
    const isOpen = !aiChatFolders;
    if (!isOpen) {
      Modal.confirm({
        title: 'Are you sure?',
        content: 'This will hide all AI chat folders, but you can enable this feature again.',
        onOk: async () => {
          setAiChatFoldersLoading(true);
          setSharedSettingOption({ aiChatFolders: isOpen });
          // delete ai chat folders
          await deleteAiChatFoldersFromUser();
          hideTip(AIChatFolderStep.classify);
          setAiChatFoldersLoading(false);
        },
        onCancel: () => {},
      });
    } else {
      setAiChatFoldersLoading(true);
      setSharedSettingOption({ aiChatFolders: isOpen });
      await aiChatFoldersTask.applyChatFolder();
      eventEmitter.emit(Actions.UpdateAIChatFoldersApplying, {
        loading: false,
      });
      ChataiStores.general?.set(GLOBAL_AICHATFOLDERS_TIP_SHOW, false);
      setAiChatFoldersLoading(false);
    }
  });

  const updateAIChatFoldersLoading = useCallback(({ loading, isApply }: { loading: boolean; isApply: boolean }) => {
    if (isApply) {
      setAiChatFoldersLoading(loading);
    } else {
      const isNext = getGlobal().chatFolders.nextAiChatFolders?.length;
      if (isNext) {
        setAiChatFoldersLoading(false);
      } else {
        setAiChatFoldersLoading(loading);
      }
    }
  }, []);

  useEffect(() => {
    eventEmitter.on(Actions.UpdateSettingAIChatFoldersLoading, updateAIChatFoldersLoading);
    return () => {
      eventEmitter.off(Actions.UpdateSettingAIChatFoldersLoading, updateAIChatFoldersLoading);
    };
  }, [updateAIChatFoldersLoading]);

  return (
    <>
      {IS_MULTIACCOUNT_SUPPORTED && currentUser && (
        <>
          <AccountMenuItems
            currentUser={currentUser}
            totalLimit={accountsTotalLimit}
            onSelectCurrent={onSelectSettings}
          />
          <MenuSeparator />
        </>
      )}
      <MenuItem
        customIcon={<img className="icon" src={AIKnowledgeIcon} alt="ai-knowledge" style={buildStyle('width: 24px;height: 24px;max-width: 24px;')} />}
        onClick={onSelectAIKnowledge}
      >
        {oldLang('Quick Replies')}
      </MenuItem>
      <MenuItem
        customIcon={<img className="icon" src={AITranslateIcon} alt="ai-translate" style={buildStyle('width: 24px;height: 24px;max-width: 24px;')} />}
        onClick={onSelectAITranslate}
      >
        {oldLang('AI Translate')}
      </MenuItem>
      <MenuItem
        customIcon={<img className="icon" src={AIChatFolderIcon} alt="ai-chat-folders" style={buildStyle('width: 24px;height: 24px;max-width: 24px; padding:3px;')} />}
        onClick={handleSwitchAIChatFolders}
      >
        <span className="menu-item-name capitalize">{oldLang('AI Chat Folders')}</span>
        <label className={buildClassName('Switcher no-animation', aiChatFoldersLoading ? 'disabled' : '')} title="">
          <input
            type="checkbox"
            id="aiChatFolders"
            checked={aiChatFolders === true}
            disabled
          />
          <span className="widget" />
        </label>
        {aiChatFoldersLoading && (
          <Spinner
            className="w-[18px] h-[18px] ml-2"
            color={theme === 'dark' ? 'white' : 'black'}
          />
        )}
      </MenuItem>
      <MenuItem
        icon="saved-messages"
        onClick={handleSelectSaved}
      >
        {oldLang('SavedMessages')}
      </MenuItem>
      {archiveSettings.isHidden && (
        <MenuItem
          icon="archive"
          onClick={onSelectArchived}
        >
          <span className="menu-item-name">{oldLang('ArchivedChats')}</span>
          {archivedUnreadChatsCount > 0 && (
            <div className="right-badge">{archivedUnreadChatsCount}</div>
          )}
        </MenuItem>
      )}
      <MenuItem
        icon="group"
        onClick={onSelectContacts}
      >
        {oldLang('Contacts')}
      </MenuItem>
      {bots.map((bot) => (
        <AttachBotItem
          bot={bot}
          theme={theme}
          isInSideMenu
          canShowNew
          onMenuOpened={onBotMenuOpened}
          onMenuClosed={onBotMenuClosed}
        />
      ))}
      <MenuItem
        icon="settings"
        onClick={onSelectSettings}
      >
        {oldLang('Settings')}
      </MenuItem>
      <MenuItem
        icon="darkmode"
        onClick={handleDarkModeToggle}
      >
        <span className="menu-item-name">{oldLang('lng_menu_night_mode')}</span>
        <Switcher
          id="darkmode"
          label={oldLang(theme === 'dark' ? 'lng_settings_disable_night_theme' : 'lng_settings_enable_night_theme')}
          checked={theme === 'dark'}
          noAnimation
        />
      </MenuItem>
      <MenuItem
        icon="animations"
        onClick={handleAnimationLevelChange}
      >
        <span className="menu-item-name capitalize">{oldLang('Appearance.Animations').toLowerCase()}</span>
        <Toggle value={animationLevelValue} />
      </MenuItem>
      <MenuItem
        icon="help"
        onClick={handleOpenTipsChat}
      >
        {oldLang('TelegramFeatures')}
      </MenuItem>
      <MenuItem
        icon="bug"
        onClick={handleBugReportClick}
      >
        {lang('MenuReportBug')}
      </MenuItem>
      {IS_BETA && (
        <MenuItem
          icon="permissions"
          onClick={handleChangelogClick}
        >
          {lang('MenuBetaChangelog')}
        </MenuItem>
      )}
      {withOtherVersions && (
        <MenuItem
          icon="K"
          isCharIcon
          href={`${WEB_VERSION_BASE}k`}
          onClick={handleSwitchToWebK}
        >
          {lang('MenuSwitchToK')}
        </MenuItem>
      )}
      {canInstall && (
        <MenuItem
          icon="install"
          onClick={getPromptInstall()}
        >
          {lang('MenuInstallApp')}
        </MenuItem>
      )}
    </>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const tabState = selectTabState(global);
    const {
      currentUserId, archiveSettings,
    } = global;
    const { animationLevel, aiChatFolders } = selectSharedSettings(global);
    const attachBots = global.attachMenu.bots;

    return {
      currentUserId,
      currentUser: selectUser(global, currentUserId!),
      theme: selectTheme(global),
      animationLevel,
      canInstall: Boolean(tabState.canInstall),
      archiveSettings,
      attachBots,
      accountsTotalLimit: selectPremiumLimit(global, 'moreAccounts'),
      aiChatFolders,
    };
  },
)(LeftSideMenuItems));
