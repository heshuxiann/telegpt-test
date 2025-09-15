/* eslint-disable no-console */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Temporal } from '@js-temporal/polyfill';
import { toBlob } from 'html-to-image';
import { getActions, getGlobal } from '../../../global';

import { MAIN_THREAD_ID } from '../../../api/types/messages';

import { selectCurrentChat, selectUser } from '../../../global/selectors';
import buildAttachment from '../../middle/composer/helpers/buildAttachment';

import Avatar from '../component/Avatar';

import MeetCalendarIcon from '../assets/meeting/meet-calendar-icon.png';
import MeetGuestIcon from '../assets/meeting/meet-guest-icon.png';
import MeetLinkIcon from '../assets/meeting/meet-link-icon.png';
import MeetTitleIcon from '../assets/meeting/meet-title-icon.png';
import SerenaPath from '../assets/serena.png';
import ShareHeaderBg from '../assets/share-header-bg.png';

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

export function formatTimeZone(tz: string, date = new Date()) {
  // 取偏移（分钟）
  const offsetMinutes = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'shortOffset', // 类似 GMT+8
  })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName')?.value || '';

  // 取完整时区名称
  const longName
    = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'long',
    })
      .formatToParts(date)
      .find((p) => p.type === 'timeZoneName')?.value || tz;

  // 提取城市名
  const city = tz.includes('/') ? tz.split('/')[1].replace('_', ' ') : tz;

  return `${offsetMinutes} ${longName} - ${city}`;
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
      border-radius: 20px;
      background-color: white;
      color: black;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

  // Create header section
  const headerSection = document.createElement('div');
  headerSection.style.cssText = `
      height: 48px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 0 20px;
      position: relative;
    `;

  // Create background blur element
  const bgImage = document.createElement('img');
  bgImage.src = ShareHeaderBg;
  bgImage.alt = '';
  bgImage.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      filter: blur(22px);
    `;
  headerSection.appendChild(bgImage);

  // Create user info container
  const userInfoContainer = document.createElement('div');
  userInfoContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
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

  const userNameSpan = document.createElement('span');
  userNameSpan.style.color = '#979797';
  userNameSpan.textContent = `${currentUser?.firstName || 'User'} ${currentUser?.lastName || ''}`.trim();

  userInfoContainer.appendChild(avatarContainer);
  userInfoContainer.appendChild(userNameSpan);
  headerSection.appendChild(userInfoContainer);

  // Create content container
  const contentElement = document.createElement('div');
  contentElement.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 0 20px;
    `;
  // Create card title
  const cardTitleSection = document.createElement('div');
  cardTitleSection.textContent = 'Meeting Invitation';
  cardTitleSection.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 8px;
    `;

  // Create title section
  // eslint-disable-next-line no-null/no-null
  let titleSection = null;
  if (eventData.summary && eventData.summary != 'Meeting Invitation') {
    titleSection = document.createElement('div');
    titleSection.style.cssText = `
      display: flex;
      gap: 8px;
      background-color: #F8FAFC;
      padding: 8px;
      border-radius: 6px;
    `;
    const titleIcon = document.createElement('img');
    titleIcon.src = MeetTitleIcon;
    titleIcon.style.cssText = `
      width: 20px;
      height: 20px;
    `;
    const titleValue = document.createElement('span');
    titleValue.style.cssText = `
      font-size: 14px;
      font-weight: 600;
    `;
    titleValue.textContent = eventData.summary || '';
    titleSection.appendChild(titleIcon);
    titleSection.appendChild(titleValue);
  }

  // Create guests section
  const guestsSection = document.createElement('div');
  guestsSection.style.cssText = `
      display: flex;
      gap: 8px;
      background-color: #F8FAFC;
      padding: 8px;
      border-radius: 6px;
    `;
  const guestIcon = document.createElement('img');
  guestIcon.src = MeetGuestIcon;
  guestIcon.style.cssText = `
      width: 20px;
      height: 20px;
    `;
  const guestsContainer = document.createElement('div');
  guestsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      font-size: 14px;
      gap: 4px;
      flex: 1;
      overflow: hidden;
    `;
  const guestsTitle = document.createElement('div');
  guestsTitle.style.fontWeight = '600';
  guestsTitle.textContent = 'Guests';

  const organizerContainer = document.createElement('div');
  organizerContainer.style.cssText = `
      display: flex;
      flex-wrap: wrap;
    `;
  const organizerEmail = document.createElement('span');
  organizerEmail.style.cssText = `
      overflow: hidden;
      word-break: break-all;
    `;
  organizerEmail.textContent = eventData.creator?.email || '';
  const organizerBadge = document.createElement('span');
  organizerBadge.style.cssText = `
      background-color: #E9EDFF;
      padding: 0 4px;
      line-height: 18px;
      border-radius: 4px;
      color: #3F6EFF;
    `;
  organizerBadge.textContent = 'Organizer';
  organizerContainer.appendChild(organizerEmail);
  organizerContainer.appendChild(organizerBadge);

  guestsContainer.appendChild(guestsTitle);
  guestsContainer.appendChild(organizerContainer);

  if (eventData.attendees && eventData.attendees.length > 0) {
    eventData.attendees.forEach((attendee: any) => {
      const guestDiv = document.createElement('div');
      guestDiv.style.cssText = `
        font-size: 14px;
        word-break: break-all;
      `;
      guestDiv.textContent = attendee.email;
      guestsContainer.appendChild(guestDiv);
    });
  }
  guestsSection.appendChild(guestIcon);
  guestsSection.appendChild(guestsContainer);

  // Create time section
  const timeSection = document.createElement('div');
  timeSection.style.cssText = `
      display: flex;
      gap: 8px;
      background-color: #F8FAFC;
      padding: 8px;
      border-radius: 6px;
    `;
  const calendarIcon = document.createElement('img');
  calendarIcon.src = MeetCalendarIcon;
  calendarIcon.style.cssText = `
      width: 20px;
      height: 20px;
    `;
  const timeContainer = document.createElement('div');
  timeContainer.style.cssText = `
      display: flex;
      flex-direction: column;
    `;
  const timeValue = document.createElement('span');
  timeValue.style.cssText = `
      font-size: 14px;
      font-weight: 600;
    `;
  timeValue.textContent = formatMeetingTimeRange(
    eventData.start.dateTime,
    eventData.end.dateTime,
  );
  const timeZone = document.createElement('span');
  timeZone.style.cssText = `
      font-size: 14px;
      color: #979797;
    `;
  timeZone.textContent = formatTimeZone(eventData.start.timeZone);
  timeContainer.appendChild(timeValue);
  timeContainer.appendChild(timeZone);
  timeSection.appendChild(calendarIcon);
  timeSection.appendChild(timeContainer);

  // Create meet section
  const meetSection = document.createElement('div');
  meetSection.style.cssText = `
      display: flex;
      gap: 8px;
      background-color: #F8FAFC;
      padding: 8px;
      border-radius: 6px;
    `;
  const meetIcon = document.createElement('img');
  meetIcon.src = MeetLinkIcon;
  meetIcon.style.cssText = `
      width: 20px;
      height: 20px;
    `;
  const meetValue = document.createElement('span');
  meetValue.style.cssText = `
      font-size: 14px;
      font-weight: 600;
    `;
  meetValue.textContent = eventData.hangoutLink || '';
  meetSection.appendChild(meetIcon);
  meetSection.appendChild(meetValue);

  // Create footer section
  const footerSection = document.createElement('div');
  footerSection.style.cssText = `
      height: 48px;
      margin-top: 24px;
      font-size: 12px;
      font-weight: 600;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #F7FAFF;
    `;
  const footerIcon = document.createElement('img');
  footerIcon.style.cssText = `
      width: 20px;
      height: 20px;
      margin-right: 6px;
      margin-top: -2px;
    `;
  footerIcon.src = SerenaPath;
  footerIcon.alt = 'Serena';
  const footerText1 = document.createElement('span');
  footerText1.style.color = '#5E6272';
  footerText1.textContent = 'Powered by ';
  const footerText2 = document.createElement('span');
  footerText2.style.color = '#2996FF';
  footerText2.textContent = 'telegpt.org';
  footerSection.appendChild(footerIcon);
  footerSection.appendChild(footerText1);
  footerSection.appendChild(footerText2);

  // Assemble the card
  cardElement.appendChild(headerSection);
  contentElement.appendChild(cardTitleSection);
  if (titleSection) {
    contentElement.appendChild(titleSection);
  }
  contentElement.appendChild(guestsSection);
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
export function attachZoneWithTemporal(semanticUtcISOString: string, timeZone: string) {
  const d = new Date(semanticUtcISOString);
  const pdt = Temporal.PlainDateTime.from({
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    millisecond: d.getUTCMilliseconds(),
  });
  const zdt = pdt.toZonedDateTime(timeZone); // 保持表盘时间，附着时区
  return {
    zonedISO: zdt.toString(), // e.g. "2025-09-04T15:00:00+08:00[Asia/Shanghai]"
    utcInstant: zdt.toInstant().toString(), // e.g. "2025-09-04T07:00:00Z"
    epoch: zdt.epochMilliseconds,
    timeZone,
    offset: zdt.offset, // e.g. "+08:00"
  };
}

// export function attachZoneWithTemporal(semanticUtcISOString: string, prevTimeZone: string, currentTimeZone: string) {
//   // 1. 先把传入的 UTC 时间解释成 prevTimeZone 的 ZonedDateTime
//   const instant = Temporal.Instant.from(semanticUtcISOString);
//   const prevZdt = instant.toZonedDateTimeISO(prevTimeZone);

//   // 2. 拿到 prevTimeZone 的表盘时间（PlainDateTime）
//   const wallClock = prevZdt.toPlainDateTime();

//   // 3. 把这个表盘时间重新附着到 currentTimeZone
//   const currentZdt = wallClock.toZonedDateTime(currentTimeZone);

//   return {
//     zonedISO: currentZdt.toString(), // e.g. "2025-09-08T20:00:00+08:00[Asia/Shanghai]"
//     utcInstant: currentZdt.toInstant().toString(), // 对应的 UTC 时间点
//     epoch: currentZdt.epochMilliseconds,
//     prevTimeZone,
//     currentTimeZone,
//     offset: currentZdt.offset,
//   };
// }
