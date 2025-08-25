import type { FC } from '../../../lib/teact/teact';
import React, {
  memo, useCallback,
  useEffect, useMemo, useRef, useState,
} from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type {
  ApiChat,
  ApiMessage,
  ApiUser,
  ApiUserStatus,
} from '../../../api/types';
import type {
  ProfileTabType, SharedMediaType,
} from '../../../types';
import type { RegularLangKey } from '../../../types/language';

import {
  SHARED_MEDIA_SLICE,
} from '../../../config';
import {
  getMessageDocument,
} from '../../../global/helpers';
import {
  selectChat,
  selectChatMessages,
  selectCurrentMessageList,
  selectCurrentSharedMediaSearch,
  selectIsRightColumnShown,
  selectTabState,
} from '../../../global/selectors';
import { IS_TOUCH_ENV } from '../../../util/browser/windowEnvironment';
import buildClassName from '../../../util/buildClassName';
import { captureEvents, SwipeDirection } from '../../../util/captureEvents';
import {
  checkIsUrl,
  documentSummary, photoSummary, videoSummary, webPageSummary,
} from '../utils/ai-analyse-message';

import useCacheBuster from '../../../hooks/useCacheBuster';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import useLang from '../../../hooks/useLang';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';
import useTransitionFixes from '../../right/hooks/useTransitionFixes';

import Document from '../../common/Document';
import Media from '../../common/Media';
import NothingFound from '../../common/NothingFound';
import WebLink from '../../common/WebLink';
import InfiniteScroll from '../../ui/InfiniteScroll';
import Modal from '../../ui/Modal';
import Spinner from '../../ui/Spinner';
import TabList from '../../ui/TabList';
import Transition from '../../ui/Transition';

import './room-attachments-modal.scss';

type OwnProps = {
  isOpen: boolean;
  onClose: () => void;
};

type StateProps = {
  chatId: string;
  currentUserId?: string;
  messagesById?: Record<number, ApiMessage>;
  foundIds?: number[];
  mediaSearchType?: SharedMediaType;
  chatsById: Record<string, ApiChat>;
  usersById: Record<string, ApiUser>;
  userStatusesById: Record<string, ApiUserStatus>;
  isRightColumnShown: boolean;
  isChatProtected?: boolean;
  nextProfileTab?: ProfileTabType;
  isSavedDialog?: boolean;
};

type TabProps = {
  type: ProfileTabType;
  key: RegularLangKey;
};

const TABS: TabProps[] = [
  { type: 'media', key: 'ProfileTabMedia' },
  { type: 'documents', key: 'ProfileTabFiles' },
  { type: 'links', key: 'ProfileTabLinks' },
];

const RoomAttachmentsModal: FC<OwnProps & StateProps> = ({
  messagesById,
  foundIds,
  mediaSearchType,
  isChatProtected,
  nextProfileTab,
  isOpen,
  onClose,
}) => {
  const {
    setSharedMediaSearchType,
    searchSharedMediaMessages,
  } = getActions();

  // eslint-disable-next-line no-null/no-null
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line no-null/no-null
  const transitionRef = useRef<HTMLDivElement>(null);

  const oldLang = useOldLang();
  const lang = useLang();
  const tabs = useMemo(() => {
    const arr: TabProps[] = [];
    arr.push(...TABS);

    return arr.map((tab) => ({
      type: tab.type,
      title: lang(tab.key),
    }));
  }, [lang]);

  const initialTab = useMemo(() => {
    if (!nextProfileTab) {
      return 0;
    }

    const index = tabs.findIndex(({ type }) => type === nextProfileTab);
    return index === -1 ? 0 : index;
  }, [nextProfileTab, tabs]);

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (!nextProfileTab) return;
    const index = tabs.findIndex(({ type }) => type === nextProfileTab);

    if (index === -1) return;
    setActiveTab(index);
  }, [nextProfileTab, tabs]);

  const handleSwitchTab = useCallback((index: number) => {
    setActiveTab(index);
  }, []);

  const renderingActiveTab = activeTab > tabs.length - 1 ? tabs.length - 1 : activeTab;
  const tabType = tabs[renderingActiveTab].type as ProfileTabType;

  // 简化版的viewport管理，只处理media、documents、links
  const resultType = tabType === 'members' || !mediaSearchType ? tabType : mediaSearchType;

  // 直接使用foundIds作为viewportIds
  const viewportIds = foundIds;
  const getMore = useLastCallback(() => {
    if (searchSharedMediaMessages) {
      searchSharedMediaMessages();
    }
  });
  const isFirstTab = resultType === 'media';
  const activeKey = tabs.findIndex(({ type }) => type === resultType);

  const { applyTransitionFix, releaseTransitionFix } = useTransitionFixes(containerRef);

  const [cacheBuster, resetCacheBuster] = useCacheBuster();

  const { observe: observeIntersectionForMedia } = useIntersectionObserver({
    rootRef: containerRef,
  });

  const handleTransitionStop = useLastCallback(() => {
    releaseTransitionFix();
    resetCacheBuster();
  });

  // Update search type when switching tabs or forum topics
  useEffect(() => {
    setSharedMediaSearchType({ mediaType: tabType as SharedMediaType });
  }, [setSharedMediaSearchType, tabType]);

  const handleSelectMedia = useLastCallback((messageId: number) => {
    const message = messagesById?.[messageId];
    if (message) {
      const {
        photo, document, webPage, text, video,
      } = message.content;
      const isUrl = checkIsUrl(text?.text);
      if (photo) {
        photoSummary(message);
      } else if (webPage || isUrl) {
        webPageSummary(message);
      } else if (document) {
        documentSummary(message);
      } else if (video) {
        videoSummary(message);
      }
      onClose();
    }
  });

  useEffect(() => {
    if (!transitionRef.current || !IS_TOUCH_ENV) {
      return undefined;
    }

    return captureEvents(transitionRef.current, {
      selectorToPreventScroll: '.Profile',
      onSwipe: ((e, direction) => {
        if (direction === SwipeDirection.Left) {
          setActiveTab(Math.min(renderingActiveTab + 1, tabs.length - 1));
          return true;
        } else if (direction === SwipeDirection.Right) {
          setActiveTab(Math.max(0, renderingActiveTab - 1));
          return true;
        }

        return false;
      }),
    });
  }, [renderingActiveTab, tabs.length]);

  function renderContent() {
    if (!viewportIds || !messagesById) {
      const noSpinner = isFirstTab;

      return (
        <div
          className="content empty-list"
        >
          {!noSpinner && <Spinner />}
        </div>
      );
    }

    const isViewportIdsEmpty = viewportIds && !viewportIds?.length;

    if (isViewportIdsEmpty) {
      let text: string;

      switch (resultType) {
        case 'documents':
          text = oldLang('lng_media_file_empty');
          break;
        case 'links':
          text = oldLang('lng_media_link_empty');
          break;
        default:
          text = oldLang('SharedMedia.EmptyTitle');
      }

      return (
        <div className="content empty-list">
          <NothingFound text={text} />
        </div>
      );
    }

    return (
      <div
        className={`content ${resultType}-list`}
        dir={oldLang.isRtl && resultType === 'media' ? 'rtl' : undefined}
        teactFastList
      >
        {resultType === 'media' ? (
          (viewportIds as number[])!.map((id) => messagesById[id] && (
            <Media
              key={id}
              message={messagesById[id]}
              isProtected={isChatProtected || messagesById[id].isProtected}
              observeIntersection={observeIntersectionForMedia}
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() => handleSelectMedia(id)}
            />
          ))
        ) : resultType === 'documents' ? (
          (viewportIds as number[])!.map((id) => messagesById[id] && (
            <Document
              key={id}
              document={getMessageDocument(messagesById[id])!}
              withDate
              smaller
              className="scroll-item"
              message={messagesById[id]}
              observeIntersection={observeIntersectionForMedia}
              canAutoLoad
              autoLoadFileMaxSizeMb={SHARED_MEDIA_SLICE}
              // eslint-disable-next-line react/jsx-no-bind
              onSelect={() => handleSelectMedia(id)}
            />
          ))
        ) : resultType === 'links' ? (
          (viewportIds as number[])!.map((id) => messagesById[id] && (
            <WebLink
              key={id}
              message={messagesById[id]}
              isProtected={isChatProtected || messagesById[id].isProtected}
              onlyWebPage
              observeIntersection={observeIntersectionForMedia}
              // eslint-disable-next-line react/jsx-no-bind
              onMessageClick={() => handleSelectMedia(id)}
            />
          ))
        ) : undefined}
      </div>
    );
  }

  // 弹窗未打开时不渲染组件内容，避免执行内部逻辑
  if (!isOpen) {
    return undefined;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="room-attachments-modal"
      title="Select a file"
      hasCloseButton
    >
      <div
        ref={containerRef}
        className="profile-container"
      >
        <div className="shared-media">
          <div
            className={buildClassName(
              'profile-content-wrapper',
              'no-selection',
            )}
          >
            <div className="shared-media-wrapper">
              <div className="shared-media-header">
                {tabs.length > 1 && (
                  <TabList
                    tabs={tabs}
                    activeTab={activeKey}
                    onSwitchTab={handleSwitchTab}
                  />
                )}

              </div>
              <Transition
                ref={transitionRef}
                name="slide"
                activeKey={activeKey}
                renderCount={tabs.length}
                className="shared-media-transition"
                onStart={applyTransitionFix}
                onStop={handleTransitionStop}
              >
                <InfiniteScroll
                  className="shared-media-list"
                  items={viewportIds}
                  onLoadMore={getMore}
                  cacheBuster={cacheBuster}
                  noScrollRestore={activeTab !== activeKey}
                  noFastList
                >
                  {renderContent()}
                </InfiniteScroll>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const { chatId } = selectCurrentMessageList(global) || {};
    const chat = selectChat(global, chatId!);
    const { currentType: mediaSearchType, resultsByType } = selectCurrentSharedMediaSearch(global) || {};
    const { foundIds } = (resultsByType && mediaSearchType && resultsByType[mediaSearchType]) || {};
    const messagesById = selectChatMessages(global, chatId!);
    const { nextProfileTab } = selectTabState(global);
    const isRightColumnShown = selectIsRightColumnShown(global);

    return {
      chatId: chatId!,
      messagesById,
      foundIds,
      mediaSearchType,
      chatsById: global.chats.byId,
      usersById: global.users.byId,
      userStatusesById: global.users.statusesById,
      isRightColumnShown,
      isChatProtected: chat?.isProtected,
      nextProfileTab,
    };
  },
)(RoomAttachmentsModal));
