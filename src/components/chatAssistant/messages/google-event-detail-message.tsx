/* eslint-disable max-len */
/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import React, { useEffect, useRef, useState } from 'react';
import type { Message } from 'ai';
import { toBlob } from 'html-to-image';
import { getGlobal } from '../../../global';

import { selectUser } from '../../../global/selectors';
import { formatMeetingTimeRange, formatTimeZone, generateEventScreenshot } from '../utils/meeting-utils';
import { FormLabel } from './google-event-create-messages';
import MessageActionsItems from './message-actions-button';

import Avatar from '../component/Avatar';

import SerenaPath from '../assets/serena.png';
import ShareHeaderBg from '../assets/share-header-bg.png';

const GoogleEventDetailMessage = ({ message }: { message: Message }) => {
  const [capturing, setCapturing] = useState(false);
  const parsedMessage = JSON.parse(message.content);
  const { eventData, chatId } = parsedMessage;
  if (!eventData) {
    return null;
  }

  const contentJSX = (
    <>
      <div>
        <FormLabel lable="title" data-readable />
        <span className="text-[14px]" data-readable>{eventData?.summary}</span>
      </div>
      <div>
        <FormLabel lable="time" data-readable />
        <div className="flex flex-col">
          <span className="text-[14px]" data-readable>
            {formatMeetingTimeRange(eventData.start.dateTime, eventData.end.dateTime)}
          </span>
          <span className="text-[14px] text-[#979797]" data-readable>
            {formatTimeZone(eventData.start.timeZone)}
          </span>
        </div>
      </div>
      {eventData?.attendees?.length > 0 && (
        <div>
          <FormLabel lable="guests" data-readable />
          {eventData?.attendees?.map((attendee: any) => (
            <div className="text-[14px]" key={attendee.email} data-readable>{attendee.email}</div>
          ))}
        </div>
      )}
      <div>
        <FormLabel lable="meet" data-readable />
        <span className="text-[14px]" data-readable>{eventData?.hangoutLink}</span>
      </div>
    </>
  );

  return (
    <div className="px-[12px]">
      <div className="flex-col gap-[12px] p-[10px] border border-solid  border-[#D9D9D9] rounded-[16px] w-[326px] bg-white dark:bg-[#292929] dark:border-[#292929]" data-message-container>
        <div className="text-[14px] font-semibold" data-readable>Event details</div>
        {contentJSX}
        <MessageActionsItems
          canCopy
          canVoice
          canShare
          message={message}
          // eslint-disable-next-line react/jsx-no-bind
          onClickShare={() => {
            // setCapturing(true);
            generateEventScreenshot(eventData, chatId)
          }}
        />
      </div>
      <ShareCard
        capturing={capturing}
        // eslint-disable-next-line react/jsx-no-bind
        captureCallback={() => {
          setCapturing(false);
        }}
      >
        {contentJSX}
      </ShareCard>
    </div>
  );
};

function ShareCard({
  capturing = false,
  children,
  captureCallback = () => { },
}: {
  capturing: boolean;
  children?: any;
  captureCallback?: () => void;
}) {
  const domRef = useRef<HTMLDivElement | undefined>(undefined);
  const global = getGlobal();
  const { currentUserId } = global;
  const currentUser = selectUser(global, currentUserId!);

  useEffect(() => {
    if (domRef.current) {
      setTimeout(() => {
        toBlob(domRef.current!, {
          width: 330,
          pixelRatio: 2, // Higher pixel ratio for better quality
          quality: 1, // Maximum quality
        })
          .then((blob) => {
            // return 123;
            const file = new File([blob!], 'telyai.org.png', { type: 'image/png' });
            // @ts-ignore
            globalThis?.p__handleFileSelect?.([file], true);
            captureCallback();
          });
      }, 100);
    }
  }, [capturing, captureCallback]);

  if (!capturing) return null;

  return (
    <div className="fixed top-0 left-0 translate-x-[-1000000px] translate-y-[-100000px]">
      <div
        ref={domRef}
        className="relative w-[330px] box-content overflow-hidden bg-white text-black"
      >
        <div className="absolute top-0 left-0 w-full blur-xl pointer-events-none">
          <img src={ShareHeaderBg} alt="" className="w-full" />
        </div>
        <div className="relative py-3 px-4 flex flex-col gap-2">
          <div className="flex flex-row justify-end items-center gap-2 text-xs text-[#979797]">
            <Avatar
              className="w-[20px] h-[20px]"
              peer={currentUser}
            />
            <span>{currentUser?.firstName}</span>
            <span>{currentUser?.lastName}</span>
          </div>
          <div className="text-[20px] font-bold">Meeting Invitation</div>
          {children}
        </div>
        <section className="flex flex-row gap-1 items-center justify-center py-2 text-xs bg-[#F7FAFF]">
          <img className="inline w-[20px] h-[20px] rounded-full" src={SerenaPath} alt="Serena" />
          Powered by
          <span className="text-[#2996FF]">telepgt.org</span>
        </section>
      </div>
    </div>

  );
}

export default GoogleEventDetailMessage;
