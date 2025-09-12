/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Temporal } from '@js-temporal/polyfill';
import { toBlob } from 'html-to-image';
import { getActions, getGlobal } from '../../../global';

import { MAIN_THREAD_ID } from '../../../api/types/messages';

import { selectCurrentChat, selectUser } from '../../../global/selectors';
import buildAttachment from '../../middle/composer/helpers/buildAttachment';

import Avatar from '../component/Avatar';

import CalendarIcon from '../assets/calendar.png';
import GoogleMeetIcon from '../assets/google-meet.png';
import SerenaPath from '../assets/serena.png';
import ShareHeaderBg from '../assets/share-header-bg.png';
import UserIcon from '../assets/user.png';
import WriteIcon from '../assets/write.png';

export function formatMeetingTimeRange(
  startISO: string,
  endISO: string,
  timeZone?: string, // 必须传入时区，例如 "Asia/Shanghai" 或 "America/New_York"
  timeZoneVisible?: boolean,
) {
  timeZone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone, // ✅ 指定时区
  });

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
    timeZone, // ✅ 指定时区
  });

  const formatTime = (date: Date) =>
    timeFormatter.format(date).toLowerCase().replace(' ', '');

  const startDate = new Date(startISO);
  const endDate = new Date(endISO);

  const dateStr = dayFormatter.format(startDate);
  const startTimeStr = formatTime(startDate);
  const endTimeStr = formatTime(endDate);

  if (timeZoneVisible) {
    return `${dateStr}, ${startTimeStr}-${endTimeStr} ${timeZone}`;
  } else {
    return `${dateStr}, ${startTimeStr}-${endTimeStr}`;
  }
}

export function generateEventScreenshot(eventData: any, chatId: string) {
  const global = getGlobal();
  const { currentUserId } = global;
  const currentUser = selectUser(global, currentUserId!);
  // Create a temporary container with proper positioning
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.transform = 'translateX(-1000000px) translateY(-1000000px)';
  container.style.zIndex = '-9999';

  // Create the main card element that will be captured
  const cardElement = document.createElement('div');
  cardElement.style.cssText = `
      position: relative;
      width: 330px;
      box-sizing: content-box;
      overflow: hidden;
      background-color: white;
      color: black;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

  // Create the background blur element
  const bgElement = document.createElement('div');
  bgElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      filter: blur(12px);
      pointer-events: none;
    `;
  const bgImage = document.createElement('img');
  bgImage.src = ShareHeaderBg;
  bgImage.alt = '';
  bgImage.style.cssText = `
      width: 100%;
    `;
  bgElement.appendChild(bgImage);

  // Create the content container
  const contentElement = document.createElement('div');
  contentElement.style.cssText = `
      position: relative;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

  // Create user info section
  const userSection = document.createElement('div');
  userSection.style.cssText = `
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #979797;
    `;

  // Create avatar container for React component
  const avatarContainer = document.createElement('div');
  avatarContainer.style.cssText = `
      width: 20px;
      height: 20px;
    `;

  // Render Avatar component using React
  const root = createRoot(avatarContainer);
  root.render(
    React.createElement(Avatar, {
      className: 'w-[20px] h-[20px]',
      peer: currentUser,
    }),
  );

  const firstName = document.createElement('span');
  firstName.textContent = currentUser?.firstName || 'User';
  const lastName = document.createElement('span');
  lastName.textContent = currentUser?.lastName || '';
  userSection.appendChild(avatarContainer);
  userSection.appendChild(firstName);
  userSection.appendChild(lastName);
  // Create card title
  const cardTitleSection = document.createElement('div');
  cardTitleSection.textContent = 'Meeting Invitation';
  cardTitleSection.style.cssText = `
      font-size: 20px;
      font-weight: 600;
    `;

  // Create title section
  const titleSection = document.createElement('div');
  const titleLabel = document.createElement('div');
  titleLabel.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    `;
  const writeIcon = document.createElement('img');
  writeIcon.src = WriteIcon;
  writeIcon.style.cssText = `
      width: 12px;
      height: 12px;
    `;
  titleLabel.appendChild(writeIcon);
  const titleText = document.createElement('span');
  titleText.textContent = 'Title';
  titleLabel.appendChild(titleText);
  const titleValue = document.createElement('span');
  titleValue.style.fontSize = '14px';
  titleValue.textContent = eventData.summary || '';
  titleSection.appendChild(titleLabel);
  titleSection.appendChild(titleValue);

  // Create guests section if attendees exist
  let guestsSection: HTMLDivElement | null = null;
  if (eventData.attendees && eventData.attendees.length > 0) {
    guestsSection = document.createElement('div');
    const guestsLabel = document.createElement('div');
    guestsLabel.style.cssText = `
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
      `;
    const userIcon = document.createElement('img');
    userIcon.src = UserIcon;
    userIcon.style.cssText = `
        width: 12px;
        height: 12px;
      `;
    guestsLabel.appendChild(userIcon);
    const guestsText = document.createElement('span');
    guestsText.textContent = 'Guests';
    guestsLabel.appendChild(guestsText);
    guestsSection.appendChild(guestsLabel);
    eventData.attendees.forEach((attendee: any) => {
      const guestDiv = document.createElement('div');
      guestDiv.style.fontSize = '14px';
      guestDiv.textContent = attendee.email;
      guestsSection!.appendChild(guestDiv);
    });
  }

  // Create time section
  const timeSection = document.createElement('div');
  const timeLabel = document.createElement('div');
  timeLabel.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    `;
  const calendarIcon = document.createElement('img');
  calendarIcon.src = CalendarIcon;
  calendarIcon.style.cssText = `
      width: 12px;
      height: 12px;
    `;
  timeLabel.appendChild(calendarIcon);
  const timeText = document.createElement('span');
  timeText.textContent = 'Time';
  timeLabel.appendChild(timeText);
  const timeContainer = document.createElement('div');
  timeContainer.style.cssText = `
      display: flex;
      flex-direction: column;
    `;
  const timeValue = document.createElement('span');
  timeValue.style.fontSize = '14px';
  timeValue.textContent = formatMeetingTimeRange(
    eventData.start.dateTime,
    eventData.end.dateTime,
    eventData.start.timeZone,
  );
  const timeZone = document.createElement('span');
  timeZone.style.cssText = `
      font-size: 14px;
      color: #979797;
    `;
  timeZone.textContent = eventData.start.timeZone;
  timeContainer.appendChild(timeValue);
  timeContainer.appendChild(timeZone);
  timeSection.appendChild(timeLabel);
  timeSection.appendChild(timeContainer);

  // Create meet section
  const meetSection = document.createElement('div');
  const meetLabel = document.createElement('div');
  meetLabel.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    `;
  const googleMeetIcon = document.createElement('img');
  googleMeetIcon.src = GoogleMeetIcon;
  googleMeetIcon.style.cssText = `
      width: 12px;
      height: 12px;
    `;
  meetLabel.appendChild(googleMeetIcon);
  const meetText = document.createElement('span');
  meetText.textContent = 'Meeting link';
  meetLabel.appendChild(meetText);
  const meetValue = document.createElement('span');
  meetValue.style.fontSize = '14px';
  meetValue.textContent = eventData.hangoutLink || '';
  meetSection.appendChild(meetLabel);
  meetSection.appendChild(meetValue);

  // Create footer section
  const footerSection = document.createElement('section');
  footerSection.style.cssText = `
      display: flex;
      flex-direction: row;
      gap: 4px;
      align-items: center;
      justify-content: center;
      padding: 8px;
      font-size: 12px;
      background-color: #F7FAFF;
    `;
  const footerIcon = document.createElement('img');
  footerIcon.style.cssText = `
      display: inline;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      margin-top: -2px;
    `;
  footerIcon.src = SerenaPath;
  footerIcon.alt = 'Serena';
  const footerText1 = document.createElement('span');
  footerText1.textContent = 'Powered by';
  const footerText2 = document.createElement('span');
  footerText2.style.color = '#2996FF';
  footerText2.textContent = 'telepgt.org';
  footerSection.appendChild(footerIcon);
  footerSection.appendChild(footerText1);
  footerSection.appendChild(footerText2);

  // Assemble the card
  cardElement.appendChild(bgElement);
  contentElement.appendChild(userSection);
  contentElement.appendChild(cardTitleSection);
  contentElement.appendChild(titleSection);
  if (guestsSection) {
    contentElement.appendChild(guestsSection);
  }
  contentElement.appendChild(timeSection);
  contentElement.appendChild(meetSection);
  cardElement.appendChild(contentElement);
  cardElement.appendChild(footerSection);
  container.appendChild(cardElement);
  document.body.appendChild(container);

  // Wait for DOM to render and then capture
  setTimeout(() => {
    toBlob(cardElement, {
      backgroundColor: 'white',
      width: 330,
      pixelRatio: 2, // Higher pixel ratio for better quality
      quality: 1, // Maximum quality
    })
      .then(async (blob) => {
        if (blob) {
          try {
            // Create attachment from blob
            const attachment = await buildAttachment(
              `event-details-${chatId}.png`,
              blob,
            );

            // Get current chat and send message with attachment
            const currentGlobal = getGlobal();
            const chat = selectCurrentChat(currentGlobal);

            if (chat) {
              getActions().sendMessage({
                messageList: {
                  chatId: chat.id,
                  threadId: MAIN_THREAD_ID,
                  type: 'thread',
                },
                attachments: [attachment],
              });
            }
          } catch (error) {
            console.error('Error sending image:', error);
          }
        }
        // Clean up the temporary element
        document.body.removeChild(container);
      })
      .catch((error) => {
        console.error('Error generating screenshot:', error);
        // Clean up the temporary element even on error
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      });
  }, 200);
}

// 保持表盘时间，附着时区
// export function attachZoneWithTemporal(semanticUtcISOString: string, timeZone: string) {
//   const d = new Date(semanticUtcISOString);
//   const pdt = Temporal.PlainDateTime.from({
//     year: d.getUTCFullYear(),
//     month: d.getUTCMonth() + 1,
//     day: d.getUTCDate(),
//     hour: d.getUTCHours(),
//     minute: d.getUTCMinutes(),
//     second: d.getUTCSeconds(),
//     millisecond: d.getUTCMilliseconds(),
//   });
//   const zdt = pdt.toZonedDateTime(timeZone); // 保持表盘时间，附着时区
//   return {
//     zonedISO: zdt.toString(), // e.g. "2025-09-04T15:00:00+08:00[Asia/Shanghai]"
//     utcInstant: zdt.toInstant().toString(), // e.g. "2025-09-04T07:00:00Z"
//     epoch: zdt.epochMilliseconds,
//     timeZone,
//     offset: zdt.offset, // e.g. "+08:00"
//   };
// }

export function attachZoneWithTemporal(semanticUtcISOString: string, prevTimeZone: string, currentTimeZone: string) {
  // 1. 先把传入的 UTC 时间解释成 prevTimeZone 的 ZonedDateTime
  const instant = Temporal.Instant.from(semanticUtcISOString);
  const prevZdt = instant.toZonedDateTimeISO(prevTimeZone);

  // 2. 拿到 prevTimeZone 的表盘时间（PlainDateTime）
  const wallClock = prevZdt.toPlainDateTime();

  // 3. 把这个表盘时间重新附着到 currentTimeZone
  const currentZdt = wallClock.toZonedDateTime(currentTimeZone);

  return {
    zonedISO: currentZdt.toString(), // e.g. "2025-09-08T20:00:00+08:00[Asia/Shanghai]"
    utcInstant: currentZdt.toInstant().toString(), // 对应的 UTC 时间点
    epoch: currentZdt.epochMilliseconds,
    prevTimeZone,
    currentTimeZone,
    offset: currentZdt.offset,
  };
}
