import type { FC } from '@teact';
import { memo, useEffect, useMemo, useRef ,useState ,useCallback} from '@teact';
import { getActions, getGlobal, withGlobal } from '../../../global';

import type { ApiChatFolder, ApiChatlistExportedInvite, ApiSession } from '../../../api/types';
import type { GlobalState } from '../../../global/types';
import type { FolderEditDispatch } from '../../../hooks/reducers/useFoldersReducer';
import type { AnimationLevel } from '../../../types';
import type { MenuItemContextAction } from '../../ui/ListItem';
import type { TabWithProperties } from '../../ui/TabList';
import { SettingsScreens } from '../../../types';

import {
  AI_FOLDER_ID, AI_FOLDER_TITLE, ALL_FOLDER_ID, PRESET_FOLDER_ID,
  PRESET_FOLDER_TITLE, UNREAD_FOLDER_ID, UNREAD_FOLDER_TITLE,
} from '../../../config';
import { selectCanShareFolder, selectIsCurrentUserFrozen, selectTabState } from '../../../global/selectors';
import { selectCurrentLimit } from '../../../global/selectors/limits';
import { selectSharedSettings } from '../../../global/selectors/sharedState';
import { IS_TOUCH_ENV } from '../../../util/browser/windowEnvironment';
import buildClassName from '../../../util/buildClassName';
import captureEscKeyListener from '../../../util/captureEscKeyListener';
import { captureEvents, SwipeDirection } from '../../../util/captureEvents';
import { MEMO_EMPTY_ARRAY } from '../../../util/memo';
import ActiveTag from '../../chatAssistant/ai-chatfolders/active-tag';
import AIChatFoldersTip, { AIChatFolderStep } from '../../chatAssistant/ai-chatfolders/ai-chatfolders-tip';
import PresetTagModal from '../../chatAssistant/ai-chatfolders/preset-modal';
import { filterAITag, filterPresetTag } from '../../chatAssistant/ai-chatfolders/tag-filter';
import { filterAIFolder } from '../../chatAssistant/ai-chatfolders/util';
import {
  ChataiStores, GLOBAL_AI_TAG, GLOBAL_AICHATFOLDERS_TIP_SHOW, GLOBAL_PRESET_TAG,
} from '../../chatAssistant/store';
import { renderTextWithEntities } from '../../common/helpers/renderTextWithEntities';

import useDerivedState from '../../../hooks/useDerivedState';
import useFlag from '../../../hooks/useFlag';
import { resolveTransitionName } from '../../../util/resolveTransitionName.ts';
import {
  useFolderManagerForUnreadChatsByFolder,
  useFolderManagerForUnreadCounters,
} from '../../../hooks/useFolderManager';
import useHistoryBack from '../../../hooks/useHistoryBack';
import useLang from '../../../hooks/useLang';
import useLastCallback from '../../../hooks/useLastCallback';
import useShowTransition from '../../../hooks/useShowTransition';

import eventEmitter, { Actions } from '../../chatAssistant/lib/EventEmitter';
import StoryRibbon from '../../story/StoryRibbon';
import TabList from '../../ui/TabList';
import Transition from '../../ui/Transition';
import ChatList from './ChatList';

type OwnProps = {
  foldersDispatch: FolderEditDispatch;
  shouldHideFolderTabs?: boolean;
  isForumPanelOpen?: boolean;
};

type StateProps = {
  chatFoldersById: Record<number, ApiChatFolder>;
  folderInvitesById: Record<number, ApiChatlistExportedInvite[]>;
  orderedFolderIds?: number[];
  activeChatFolder: number;
  currentUserId?: string;
  animationLevel: AnimationLevel;
  shouldSkipHistoryAnimations?: boolean;
  maxFolders: number;
  maxChatLists: number;
  maxFolderInvites: number;
  hasArchivedChats?: boolean;
  hasArchivedStories?: boolean;
  archiveSettings: GlobalState['archiveSettings'];
  isStoryRibbonShown?: boolean;
  sessions?: Record<string, ApiSession>;
  isAccountFrozen?: boolean;
  aiChatFolders?: boolean;
};

const SAVED_MESSAGES_HOTKEY = '0';
const FIRST_FOLDER_INDEX = 0;

const ChatFolders: FC<OwnProps & StateProps> = ({
  foldersDispatch,
  chatFoldersById,
  orderedFolderIds,
  activeChatFolder,
  currentUserId,
  isForumPanelOpen,
  animationLevel,
  shouldSkipHistoryAnimations,
  maxFolders,
  maxChatLists,
  shouldHideFolderTabs,
  folderInvitesById,
  maxFolderInvites,
  hasArchivedChats,
  hasArchivedStories,
  archiveSettings,
  isStoryRibbonShown,
  sessions,
  isAccountFrozen,
  aiChatFolders,
}) => {
  const {
    loadChatFolders,
    setActiveChatFolder,
    openChat,
    openShareChatFolderModal,
    openDeleteChatFolderModal,
    openEditChatFolder,
    openLimitReachedModal,
    markChatMessagesRead,
    openSettingsScreen
  } = getActions();
   // eslint-disable-next-line no-null/no-null
  const transitionRef = useRef<HTMLDivElement>();
  const [shouldRenderPresetTagModal, openRenderPresetTagModal, closeRenderPresetTagModal] = useFlag();
  const [activePresetTag, setActivePresetTag] = useState<string[]>([]);
  const [activeAITag, setActiveAITag] = useState<string[]>([]);
  const [shouldRenderAiChatFoldersTip, openRenderAiChatFoldersTip, closeRenderAiChatFoldersTip] = useFlag();

  const [aiChatFoldersStep, setAiChatFoldersStep] = useState<AIChatFolderStep>(AIChatFolderStep.classify);
  const [aiChatFoldersloading, setAiChatFoldersLoading] = useState<boolean>(false);

  

  const lang = useLang();

  useEffect(() => {
    loadChatFolders();
  }, []);

  const {
    ref,
    shouldRender: shouldRenderStoryRibbon,
    getIsClosing: getIsStoryRibbonClosing,
  } = useShowTransition({
    isOpen: isStoryRibbonShown,
    className: false,
    withShouldRender: true,
  });
  const isStoryRibbonClosing = useDerivedState(getIsStoryRibbonClosing);

  const scrollToTop = useLastCallback(() => {
    const activeList = ref.current?.querySelector<HTMLElement>('.chat-list.Transition_slide-active');
    activeList?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });

  const allChatsFolder: ApiChatFolder = useMemo(() => {
    return {
      id: ALL_FOLDER_ID,
      title: { text: orderedFolderIds?.[0] === ALL_FOLDER_ID ? lang('FilterAllChatsShort') : lang('FilterAllChats') },
      includedChatIds: MEMO_EMPTY_ARRAY,
      excludedChatIds: MEMO_EMPTY_ARRAY,
    } satisfies ApiChatFolder;
  }, [orderedFolderIds, lang]);

  const presetChatsFolder: ApiChatFolder = useMemo(() => {
    return {
      id: PRESET_FOLDER_ID,
      title: { text: PRESET_FOLDER_TITLE },
      includedChatIds: MEMO_EMPTY_ARRAY,
      excludedChatIds: MEMO_EMPTY_ARRAY,
    } satisfies ApiChatFolder;
  }, []);

  const unreadChatsFolder: ApiChatFolder = useMemo(() => {
    return {
      id: UNREAD_FOLDER_ID,
      title: { text: UNREAD_FOLDER_TITLE },
      includedChatIds: MEMO_EMPTY_ARRAY,
      excludedChatIds: MEMO_EMPTY_ARRAY,
    } satisfies ApiChatFolder;
  }, []);

  const AIChatsFolder: ApiChatFolder = useMemo(() => {
    return {
      id: AI_FOLDER_ID,
      title: { text: AI_FOLDER_TITLE },
      includedChatIds: MEMO_EMPTY_ARRAY,
      excludedChatIds: MEMO_EMPTY_ARRAY,
    } satisfies ApiChatFolder;
  }, []);

  const displayedFolders = useMemo(() => {
    const chatFolders = Object.values(chatFoldersById);
    return orderedFolderIds
      ? orderedFolderIds?.map((id) => {
        if (id === ALL_FOLDER_ID) {
          return allChatsFolder;
        }
        if (id === PRESET_FOLDER_ID
          && !chatFolders.find((o) => o?.title?.text === PRESET_FOLDER_TITLE)
        ) {
          return presetChatsFolder;
        }
        if (id === UNREAD_FOLDER_ID
          && !chatFolders.find((o) => o?.title?.text === UNREAD_FOLDER_TITLE)
        ) {
          return unreadChatsFolder;
        }
        if (id === AI_FOLDER_ID
          && !chatFolders.find((o) => o?.title?.text === AI_FOLDER_TITLE)
        ) {
          return AIChatsFolder;
        }
        return chatFoldersById?.[id] || {};
      }).filter(Boolean)
      : undefined;
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [chatFoldersById, allChatsFolder, orderedFolderIds, JSON.stringify(orderedFolderIds),
    presetChatsFolder, unreadChatsFolder, AIChatsFolder]);

  const allChatsFolderIndex = displayedFolders?.findIndex((folder) => folder.id === ALL_FOLDER_ID);
  const isInAllChatsFolder = allChatsFolderIndex === activeChatFolder;
  const isInFirstFolder = FIRST_FOLDER_INDEX === activeChatFolder;
  const isInPresetFolder = displayedFolders?.findIndex((folder) => folder.id === PRESET_FOLDER_ID) === activeChatFolder;
  const isInUnreadFolder = displayedFolders?.findIndex((folder) => folder.id === UNREAD_FOLDER_ID) === activeChatFolder;
  const isInAIFolder = displayedFolders?.findIndex((folder) => folder.id === AI_FOLDER_ID) === activeChatFolder;

  const folderUnreadChatsCountersById = useFolderManagerForUnreadChatsByFolder();
  const handleReadAllChats = useLastCallback((folderId: number) => {
    const unreadChatIds = folderUnreadChatsCountersById[folderId];
    if (!unreadChatIds?.length) return;

    unreadChatIds.forEach((chatId) => {
      markChatMessagesRead({ id: chatId });
    });
  });

  const folderCountersById = useFolderManagerForUnreadCounters();
  const folderTabs = useMemo(() => {
    if (!displayedFolders || !displayedFolders.length) {
      return undefined;
    }

    return displayedFolders.map((folder, i) => {
      const { id, title } = folder;
      const isBlocked = id !== ALL_FOLDER_ID && i > maxFolders - 1;
      const canShareFolder = selectCanShareFolder(getGlobal(), id);
      const contextActions: MenuItemContextAction[] = [];
      let badgeCount = folderCountersById[id]?.chatsCount;

      if (canShareFolder) {
        contextActions.push({
          title: lang('FilterShare'),
          icon: 'link',
          handler: () => {
            const chatListCount = Object.values(chatFoldersById).reduce((acc, el) => acc + (el.isChatList ? 1 : 0), 0);
            if (chatListCount >= maxChatLists && !folder.isChatList) {
              openLimitReachedModal({
                limit: 'chatlistJoined',
              });
              return;
            }

            // Greater amount can be after premium downgrade
            if (folderInvitesById[id]?.length >= maxFolderInvites) {
              openLimitReachedModal({
                limit: 'chatlistInvites',
              });
              return;
            }

            openShareChatFolderModal({
              folderId: id,
            });
          },
        });
      }

      if (id === ALL_FOLDER_ID) {
        contextActions.push({
          title: lang('FilterEditFolders'),
          icon: 'edit',
          handler: () => {
            openSettingsScreen({ screen: SettingsScreens.Folders });
          },
        });

        if (folderUnreadChatsCountersById[id]?.length) {
          contextActions.push({
            title: lang('ChatListMarkAllAsRead'),
            icon: 'readchats',
            handler: () => handleReadAllChats(folder.id),
          });
        }
      } if (id === PRESET_FOLDER_ID || id === UNREAD_FOLDER_ID || id === AI_FOLDER_ID) {
        if (folderUnreadChatsCountersById[id]?.length) {
          contextActions.push({
            title: lang('ChatListMarkAllAsRead'),
            icon: 'readchats',
            handler: () => handleReadAllChats(folder.id),
          });
        }
        if (id === PRESET_FOLDER_ID) {
          badgeCount = filterPresetTag(folderUnreadChatsCountersById[id])?.length;
        } else if (id === AI_FOLDER_ID) {
          badgeCount = filterAITag(folderUnreadChatsCountersById[id])?.length;
        }
      } else {
        contextActions.push({
          title: lang('EditFolder'),
          icon: 'edit',
          handler: () => {
            openEditChatFolder({ folderId: id });
          },
        });

        if (folderUnreadChatsCountersById[id]?.length) {
          contextActions.push({
            title: lang('ChatListMarkAllAsRead'),
            icon: 'readchats',
            handler: () => handleReadAllChats(folder.id),
          });
        }

        contextActions.push({
          title: lang('FilterMenuDelete'),
          icon: 'delete',
          destructive: true,
          handler: () => {
            openDeleteChatFolderModal({ folderId: id });
          },
        });
      }

      return {
        id,
        title: renderTextWithEntities({
          text: title.text,
          entities: title.entities,
          noCustomEmojiPlayback: folder.noTitleAnimations,
        }),
        badgeCount,
        isBadgeActive: Boolean(folderCountersById[id]?.notificationsCount),
        isBlocked,
        contextActions: contextActions?.length ? contextActions : undefined,
      } satisfies TabWithProperties;
    });
  }, [
    displayedFolders, maxFolders, folderCountersById, lang, chatFoldersById, maxChatLists, folderInvitesById,
    maxFolderInvites, folderUnreadChatsCountersById, openSettingsScreen,
  ]);

  const handleSwitchTab = useLastCallback((index: number) => {
    setActiveChatFolder({ activeChatFolder: index }, { forceOnHeavyAnimation: true });
    if (activeChatFolder === index) {
      scrollToTop();
    }
    if (folderTabs![index].id === PRESET_FOLDER_ID || folderTabs![index].id === AI_FOLDER_ID) {
      openRenderPresetTagModal();
    } else {
      closeRenderPresetTagModal();
    }
  });

  // Prevent `activeTab` pointing at non-existing folder after update
  useEffect(() => {
    if (!folderTabs?.length) {
      return;
    }

    if (activeChatFolder >= folderTabs.length) {
      setActiveChatFolder({ activeChatFolder: FIRST_FOLDER_INDEX });
    }
  }, [activeChatFolder, folderTabs, setActiveChatFolder]);

  useEffect(() => {
    if (!IS_TOUCH_ENV || !folderTabs?.length || isForumPanelOpen) {
      return undefined;
    }

    return captureEvents(transitionRef.current!, {
      selectorToPreventScroll: '.chat-list',
      onSwipe: (e, direction) => {
        if (direction === SwipeDirection.Left) {
          setActiveChatFolder(
            { activeChatFolder: Math.min(activeChatFolder + 1, folderTabs.length - 1) },
            { forceOnHeavyAnimation: true },
          );
          return true;
        } else if (direction === SwipeDirection.Right) {
          setActiveChatFolder({ activeChatFolder: Math.max(0, activeChatFolder - 1) }, { forceOnHeavyAnimation: true });
          return true;
        }

        return false;
      },
    });
  }, [activeChatFolder, folderTabs, isForumPanelOpen, setActiveChatFolder]);

  const isNotInFirstFolderRef = useRef();
  isNotInFirstFolderRef.current = !isInFirstFolder;
  useEffect(() => (isNotInFirstFolderRef.current ? captureEscKeyListener(() => {
    if (isNotInFirstFolderRef.current) {
      setActiveChatFolder({ activeChatFolder: FIRST_FOLDER_INDEX });
    }
  }) : undefined), [activeChatFolder, setActiveChatFolder]);

  useHistoryBack({
    isActive: !isInFirstFolder,
    onBack: () => setActiveChatFolder({ activeChatFolder: FIRST_FOLDER_INDEX }, { forceOnHeavyAnimation: true }),
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code.startsWith('Digit') && folderTabs) {
        const [, digit] = e.code.match(/Digit(\d)/) || [];
        if (!digit) return;

        if (digit === SAVED_MESSAGES_HOTKEY) {
          openChat({ id: currentUserId, shouldReplaceHistory: true });
          return;
        }

        const folder = Number(digit) - 1;
        if (folder > folderTabs.length - 1) return;

        setActiveChatFolder({ activeChatFolder: folder }, { forceOnHeavyAnimation: true });
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [currentUserId, folderTabs, openChat, setActiveChatFolder]);

  useEffect(() => {
    ChataiStores.general?.get(GLOBAL_PRESET_TAG)?.then((res) => {
      setActivePresetTag(res ?? []);
    });
    ChataiStores.general?.get(GLOBAL_AI_TAG)?.then((res) => {
      setActiveAITag(res ?? []);
    });
  }, []);

  useEffect(() => {
    const isNext = getGlobal().chatFolders.nextAiChatFolders?.length;
    if (isNext) {
      setAiChatFoldersStep(AIChatFolderStep.apply);
    } else {
      setAiChatFoldersStep(AIChatFolderStep.classify);
    }
    ChataiStores.general?.get(GLOBAL_AICHATFOLDERS_TIP_SHOW)?.then((res) => {
      if (res === undefined || (res === true && aiChatFolders)) {
        openRenderAiChatFoldersTip();
      } else {
        closeRenderAiChatFoldersTip();
      }
    });
  }, [aiChatFoldersloading, shouldRenderAiChatFoldersTip, aiChatFolders]);

  const updateAIChatFoldsLoading = useCallback(async (
    { loading, isShowTip } : { loading: boolean; isShowTip?: boolean },
  ) => {
    setAiChatFoldersLoading(loading);
    const tipShowRes = await ChataiStores.general?.get(GLOBAL_AICHATFOLDERS_TIP_SHOW);
    if ((aiChatFolders || tipShowRes === undefined) && isShowTip) {
      openRenderAiChatFoldersTip();
    }
  }, [aiChatFolders]);

  useEffect(() => {
    eventEmitter.on(Actions.UpdateAIChatFoldersApplying, updateAIChatFoldsLoading);
    return () => {
      eventEmitter.off(Actions.UpdateAIChatFoldersApplying, updateAIChatFoldsLoading);
    };
  }, [updateAIChatFoldsLoading]);

  const {
    ref: placeholderRef,
    shouldRender: shouldRenderPlaceholder,
  } = useShowTransition({
    isOpen: !orderedFolderIds,
    noMountTransition: true,
    withShouldRender: true,
  });

    function getFolderType() {
    if (isInAllChatsFolder) {
      return 'all';
    } else if (isInPresetFolder) {
      return 'preset';
    } else if (isInUnreadFolder) {
      return 'unread';
    } else if (isInAIFolder) {
      return 'ai';
    } else {
      return 'folder';
    }
  }

  function renderCurrentTab(isActive: boolean) {
    const activeFolder = Object.values(chatFoldersById)
      .find(({ id }) => id === folderTabs![activeChatFolder].id);
    const isFolder = activeFolder && !isInAllChatsFolder;

    return (
      <ChatList
        folderType={isFolder ? 'folder' : 'all'}
        folderId={isFolder ? activeFolder.id : undefined}
        isActive={isActive}
        isForumPanelOpen={isForumPanelOpen}
        foldersDispatch={foldersDispatch}
        isMainList
        canDisplayArchive={(hasArchivedChats || hasArchivedStories) && !archiveSettings.isHidden}
        archiveSettings={archiveSettings}
        sessions={sessions}
        isAccountFrozen={isAccountFrozen}
        activeTag={shouldRenderFolders
          ? (folderTabs![activeChatFolder]?.id === PRESET_FOLDER_ID ? activePresetTag : activeAITag) : []}
      />
    );
  }

  const shouldRenderFolders = folderTabs && folderTabs.length > 1;

  return (
    <div
      ref={ref}
      className={buildClassName(
        'ChatFolders',
        shouldRenderFolders && shouldHideFolderTabs && 'ChatFolders--tabs-hidden',
        shouldRenderStoryRibbon && 'with-story-ribbon',
      )}
    >
      {shouldRenderStoryRibbon && <StoryRibbon isClosing={isStoryRibbonClosing} />}
      {shouldRenderFolders ? (
        <TabList
          contextRootElementSelector="#LeftColumn"
          tabs={folderTabs}
          activeTab={activeChatFolder}
          onSwitchTab={handleSwitchTab}
        />
      ) : shouldRenderPlaceholder ? (
        <div ref={placeholderRef} className="tabs-placeholder" />
      ) : undefined}
      {shouldRenderAiChatFoldersTip && aiChatFoldersStep === AIChatFolderStep.apply
        && (
          <AIChatFoldersTip
            loading={aiChatFoldersloading}
            step={aiChatFoldersStep}
            onClose={closeRenderAiChatFoldersTip}
          />
        )}
      {shouldRenderFolders && shouldRenderPresetTagModal && (
        <PresetTagModal
          activeTag={folderTabs![activeChatFolder].id === PRESET_FOLDER_ID ? activePresetTag : activeAITag}
          setActiveTag={folderTabs![activeChatFolder].id === PRESET_FOLDER_ID ? setActivePresetTag : setActiveAITag}
          isOpen={shouldRenderPresetTagModal}
          onClose={closeRenderPresetTagModal}
          folderId={folderTabs![activeChatFolder].id}
        />
      )}
      {shouldRenderFolders && (
        <ActiveTag
          folderType={getFolderType()}
          tags={folderTabs![activeChatFolder]?.id === PRESET_FOLDER_ID ? activePresetTag : activeAITag}
          setActiveTag={folderTabs![activeChatFolder]?.id === PRESET_FOLDER_ID ? setActivePresetTag : setActiveAITag}
        />
      )}
      <Transition
        ref={transitionRef}
        name={resolveTransitionName('slideOptimized', animationLevel, shouldSkipHistoryAnimations, lang.isRtl)}
        activeKey={activeChatFolder}
        renderCount={shouldRenderFolders ? folderTabs.length : undefined}
      >
        {renderCurrentTab}
      </Transition>
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const {
      chatFolders: {
        byId: chatFoldersById,
        invites: folderInvitesById,
      },
      chats: {
        listIds: {
          archived,
        },
      },
      stories: {
        orderedPeerIds: {
          archived: archivedStories,
        },
      },
      activeSessions: {
        byHash: sessions,
      },
      currentUserId,
      archiveSettings,
    } = global;
    let orderedFolderIds = global.chatFolders.orderedIds;
    const { shouldSkipHistoryAnimations, activeChatFolder } = selectTabState(global);
    const { storyViewer: { isRibbonShown: isStoryRibbonShown } } = selectTabState(global);
    const isAccountFrozen = selectIsCurrentUserFrozen(global);
    const { aiChatFolders } = selectSharedSettings(global);
    if (aiChatFolders !== true) {
      orderedFolderIds = filterAIFolder(orderedFolderIds);
    }
    const { animationLevel } = selectSharedSettings(global);

    return {
      chatFoldersById,
      folderInvitesById,
      orderedFolderIds,
      activeChatFolder,
      currentUserId,
      animationLevel,
      shouldSkipHistoryAnimations,
      hasArchivedChats: Boolean(archived?.length),
      hasArchivedStories: Boolean(archivedStories?.length),
      maxFolders: selectCurrentLimit(global, 'dialogFilters'),
      maxFolderInvites: selectCurrentLimit(global, 'chatlistInvites'),
      maxChatLists: selectCurrentLimit(global, 'chatlistJoined'),
      archiveSettings,
      isStoryRibbonShown,
      sessions,
      isAccountFrozen,
      aiChatFolders,
    };
  },
)(ChatFolders));
