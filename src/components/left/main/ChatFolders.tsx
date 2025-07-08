import type { FC } from '../../../lib/teact/teact';
import React, {
  memo, useEffect, useMemo, useRef,
  useState,
} from '../../../lib/teact/teact';
import { getActions, getGlobal, withGlobal } from '../../../global';

import type { ApiChatFolder, ApiChatlistExportedInvite, ApiSession } from '../../../api/types';
import type { GlobalState } from '../../../global/types';
import type { FolderEditDispatch } from '../../../hooks/reducers/useFoldersReducer';
import type { LeftColumnContent } from '../../../types';
import type { MenuItemContextAction } from '../../ui/ListItem';
import type { TabWithProperties } from '../../ui/TabList';
import { SettingsScreens } from '../../../types';

import { AI_FOLDER_ID, AI_FOLDER_TITLE, ALL_FOLDER_ID, PRESET_FOLDER_ID, PRESET_FOLDER_TITLE, UNREAD_FOLDER_ID, UNREAD_FOLDER_TITLE } from '../../../config';
import { selectCanShareFolder, selectIsCurrentUserFrozen, selectTabState } from '../../../global/selectors';
import { selectCurrentLimit } from '../../../global/selectors/limits';
import { IS_TOUCH_ENV } from '../../../util/browser/windowEnvironment';
import buildClassName from '../../../util/buildClassName';
import captureEscKeyListener from '../../../util/captureEscKeyListener';
import { captureEvents, SwipeDirection } from '../../../util/captureEvents';
import { MEMO_EMPTY_ARRAY } from '../../../util/memo';
import { renderTextWithEntities } from '../../common/helpers/renderTextWithEntities';

import useDerivedState from '../../../hooks/useDerivedState';
import {
  useFolderManagerForUnreadChatsByFolder,
  useFolderManagerForUnreadCounters,
} from '../../../hooks/useFolderManager';
import useHistoryBack from '../../../hooks/useHistoryBack';
import useLang from '../../../hooks/useLang';
import useLastCallback from '../../../hooks/useLastCallback';
import useShowTransition from '../../../hooks/useShowTransition';

import StoryRibbon from '../../story/StoryRibbon';
import TabList from '../../ui/TabList';
import Transition from '../../ui/Transition';
import ChatList from './ChatList';
import PresetTagModal from '../../chatAssistant/ai-chatfolders/preset-modal'
import useFlag from "../../../hooks/useFlag"
import { ChataiStores, GLOBAL_AI_TAG, GLOBAL_AICHATFOLDERS_STEP, GLOBAL_AICHATFOLDERS_TIP_SHOW, GLOBAL_PRESET_TAG } from "../../chatAssistant/store"
import { filterAITag, filterPresetTag } from "../../chatAssistant/ai-chatfolders/tag-filter"
import AIChatFoldersTip, { AIChatFolderStep } from "../../chatAssistant/ai-chatfolders/ai-chatfolders-tip"
import ActiveTag from "../../chatAssistant/ai-chatfolders/active-tag"
import { selectSharedSettings } from "../../../global/selectors/sharedState"
import { filterAIFolder } from "../../chatAssistant/ai-chatfolders/util"
import eventEmitter, { Actions } from "../../chatAssistant/lib/EventEmitter"

type OwnProps = {
  onSettingsScreenSelect: (screen: SettingsScreens) => void;
  foldersDispatch: FolderEditDispatch;
  onLeftColumnContentChange: (content: LeftColumnContent) => void;
  shouldHideFolderTabs?: boolean;
  isForumPanelOpen?: boolean;
};

type StateProps = {
  chatFoldersById: Record<number, ApiChatFolder>;
  folderInvitesById: Record<number, ApiChatlistExportedInvite[]>;
  orderedFolderIds?: number[];
  activeChatFolder: number;
  currentUserId?: string;
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
};

const SAVED_MESSAGES_HOTKEY = '0';
const FIRST_FOLDER_INDEX = 0;

const ChatFolders: FC<OwnProps & StateProps> = ({
  foldersDispatch,
  onSettingsScreenSelect,
  onLeftColumnContentChange,
  chatFoldersById,
  orderedFolderIds,
  activeChatFolder,
  currentUserId,
  isForumPanelOpen,
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
  } = getActions();

  // eslint-disable-next-line no-null/no-null
  const transitionRef = useRef<HTMLDivElement>(null);
  const [shouldRenderPresetTagModal, openRenderPresetTagModal, closeRenderPresetTagModal] = useFlag();
  const [activePresetTag, setActivePresetTag] = useState<string[]>([])
  const [activeAITag, setActiveAITag] = useState<string[]>([])
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

  const presetChatsFolder: ApiChatFolder = {
    id: PRESET_FOLDER_ID,
    title: { text: PRESET_FOLDER_TITLE },
    includedChatIds: MEMO_EMPTY_ARRAY,
    excludedChatIds: MEMO_EMPTY_ARRAY
  };

  const unreadChatsFolder: ApiChatFolder = {
    id: UNREAD_FOLDER_ID,
    title: { text: UNREAD_FOLDER_TITLE },
    includedChatIds: MEMO_EMPTY_ARRAY,
    excludedChatIds: MEMO_EMPTY_ARRAY,
  };

  const AIChatsFolder: ApiChatFolder = {
    id: AI_FOLDER_ID,
    title: { text: AI_FOLDER_TITLE },
    includedChatIds: MEMO_EMPTY_ARRAY,
    excludedChatIds: MEMO_EMPTY_ARRAY,
  };

  const displayedFolders = useMemo(() => {
    const chatFolders = Object.values(chatFoldersById)
    return orderedFolderIds
      ? orderedFolderIds?.map((id) => {
        if (id === ALL_FOLDER_ID) {
          return allChatsFolder;
        }
        if (id === PRESET_FOLDER_ID &&
          !chatFolders.find(o => o?.title?.text === PRESET_FOLDER_TITLE)
        ) {
          return presetChatsFolder;
        }
        if (id === UNREAD_FOLDER_ID &&
          !chatFolders.find(o => o?.title?.text === UNREAD_FOLDER_TITLE)
        ) {
          return unreadChatsFolder;
        }
        if (id === AI_FOLDER_ID &&
          !chatFolders.find(o => o?.title?.text === AI_FOLDER_TITLE)
        ) {
          return AIChatsFolder;
        }
        return chatFoldersById?.[id] || {};
      }).filter(Boolean)
      : undefined;
  }, [chatFoldersById, allChatsFolder, JSON.stringify(orderedFolderIds), presetChatsFolder, unreadChatsFolder, AIChatsFolder]);

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
      let badgeCount = folderCountersById[id]?.chatsCount

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
            onSettingsScreenSelect(SettingsScreens.Folders);
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
          badgeCount = filterPresetTag(folderUnreadChatsCountersById[id])?.length
        } else if (id === AI_FOLDER_ID) {
          badgeCount = filterAITag(folderUnreadChatsCountersById[id])?.length
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
    maxFolderInvites, folderUnreadChatsCountersById, onSettingsScreenSelect, activePresetTag, filterPresetTag,
    activeAITag, filterAITag
  ]);

  const handleSwitchTab = useLastCallback((index: number) => {
    setActiveChatFolder({ activeChatFolder: index }, { forceOnHeavyAnimation: true });
    if (activeChatFolder === index) {
      scrollToTop();
    }
    if (folderTabs![index].id === PRESET_FOLDER_ID || folderTabs![index].id === AI_FOLDER_ID) {
      openRenderPresetTagModal()
    } else {
      closeRenderPresetTagModal()
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
      onSwipe: ((e, direction) => {
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
      }),
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

  useEffect(()=>{
    ChataiStores.general?.get(GLOBAL_PRESET_TAG)?.then((res)=>{
      setActivePresetTag(res ?? [])
    })
    ChataiStores.general?.get(GLOBAL_AI_TAG)?.then((res)=>{
      setActiveAITag(res ?? [])
    })
  }, [])

  useEffect(()=>{
    const isNext = getGlobal().chatFolders.nextAiChatFolders?.length;
    if (isNext) {
      openRenderAiChatFoldersTip();
      setAiChatFoldersStep(AIChatFolderStep.apply);
    } else {
      ChataiStores.general?.get(GLOBAL_AICHATFOLDERS_TIP_SHOW)?.then((res)=>{
        res === false ? closeRenderAiChatFoldersTip() : openRenderAiChatFoldersTip()
      })
      ChataiStores.general?.get(GLOBAL_AICHATFOLDERS_STEP)?.then((res)=>{
        if (res) {
          setAiChatFoldersStep(res)
        }
      })
    }
  }, [aiChatFoldersloading])

  const updateAIChatFoldsLoading = ({ loading, isShowTip }: { loading: boolean; isShowTip?: boolean; }) => {
    setAiChatFoldersLoading(loading)
    if (isShowTip) {
      openRenderAiChatFoldersTip();
    }
  }

  useEffect(() => {
    eventEmitter.on(Actions.UpdateAIChatFoldsLoading, updateAIChatFoldsLoading);
    return () => {
      eventEmitter.off(Actions.UpdateAIChatFoldsLoading, updateAIChatFoldsLoading);
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
    const activeFolder = Object.values(chatFoldersById)?.find(({ id }) => id === folderTabs?.[activeChatFolder]?.id);
    const isFolder = activeFolder && !isInAllChatsFolder && !isInPresetFolder && !isInPresetFolder && !isInAIFolder;
    const folderType = getFolderType();

    return (
      <ChatList
        folderType={isFolder ? 'folder' : folderType}
        folderId={isFolder ? activeFolder?.id : undefined}
        isActive={isActive}
        isForumPanelOpen={isForumPanelOpen}
        foldersDispatch={foldersDispatch}
        onSettingsScreenSelect={onSettingsScreenSelect}
        onLeftColumnContentChange={onLeftColumnContentChange}
        canDisplayArchive={(hasArchivedChats || hasArchivedStories) && !archiveSettings.isHidden}
        archiveSettings={archiveSettings}
        sessions={sessions}
        isAccountFrozen={isAccountFrozen}
        activeTag={shouldRenderFolders ? (folderTabs![activeChatFolder]?.id === PRESET_FOLDER_ID ? activePresetTag : activeAITag) :[]}
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
      {(shouldRenderAiChatFoldersTip || aiChatFoldersloading) && <AIChatFoldersTip
        step={aiChatFoldersStep}
        loading={aiChatFoldersloading}
        onClose={closeRenderAiChatFoldersTip}
      />}
      {shouldRenderFolders && shouldRenderPresetTagModal && <PresetTagModal
        activeTag={folderTabs![activeChatFolder].id === PRESET_FOLDER_ID ? activePresetTag : activeAITag}
        setActiveTag={folderTabs![activeChatFolder].id === PRESET_FOLDER_ID ? setActivePresetTag : setActiveAITag}
        isOpen={shouldRenderPresetTagModal}
        onClose={closeRenderPresetTagModal}
        folderId={folderTabs![activeChatFolder].id}
      />}
      {shouldRenderFolders && <ActiveTag
        folderType={getFolderType()}
        tags={folderTabs![activeChatFolder]?.id === PRESET_FOLDER_ID ? activePresetTag : activeAITag}
        setActiveTag={folderTabs![activeChatFolder]?.id === PRESET_FOLDER_ID ? setActivePresetTag : setActiveAITag}
      />}
      <Transition
        ref={transitionRef}
        name={shouldSkipHistoryAnimations ? 'none' : lang.isRtl ? 'slideOptimizedRtl' : 'slideOptimized'}
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

    return {
      chatFoldersById,
      folderInvitesById,
      orderedFolderIds,
      activeChatFolder,
      currentUserId,
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
    };
  },
)(ChatFolders));
