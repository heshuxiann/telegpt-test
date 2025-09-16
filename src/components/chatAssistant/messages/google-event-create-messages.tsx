/* eslint-disable no-console */

import React from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { Message } from 'ai';
import {
  Button, ConfigProvider, DatePicker, Input,
  Select,
  theme,
} from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { getGlobal } from '../../../global';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { selectTheme } from '../../../global/selectors';
import { CloseIcon } from '../icons';
import { createGoogleMeet } from '../utils/google-api';
import { getAuthState } from '../utils/google-auth';
import { useTimezoneSelect } from '../utils/time-zones';

import CalendarIcon from '../assets/calendar.png';
import DefaultAvatar from '../assets/default-avatar.png';
import GoogleMeetIcon from '../assets/google-meet.png';
import UserIcon from '../assets/user.png';
import WriteIcon from '../assets/write.png';

export const FormLabel = (props: { lable: 'title' | 'time' | 'guests' | 'meet' }) => {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('');
  const { lable: label } = props;
  useEffect(() => {
    switch (label) {
      case 'title':
        setIcon(WriteIcon);
        setTitle('Title');
        break;
      case 'time':
        setIcon(CalendarIcon);
        setTitle('Time');
        break;
      case 'guests':
        setIcon(UserIcon);
        setTitle('Guests');
        break;
      case 'meet':
        setIcon(GoogleMeetIcon);
        setTitle('Meeting link');
        break;
    }
  }, [label]);
  return (
    <div className="flex items-center gap-[8px]">
      <img src={icon} alt="" className="w-[16px] h-[16px]" />
      <span className="text-[14px] font-semibold">{title}</span>
    </div>
  );
};

const ErrorTip = ({ message }: { message: string }) => {
  return (
    <div className="text-[12px] leading-[18px] text-red-400">{message}</div>
  );
};

const EmailItem = ({ email, onDelete }: { email: string; onDelete: (email: string) => void }) => {
  return (
    <div className="flex items-center gap-[8px] py-[10px]">
      <img className="w-[24px] h-[24px] rounded-full" src={DefaultAvatar} alt="" />
      <span className="text-[14px] text-black overflow-hidden text-ellipsis">{email}</span>
      <div
        className="ml-auto cursor-pointer w-[20px] h-[20px] rounded-full text-[#979797] bg-[#F3F3F3] flex items-center justify-center"
        onClick={() => onDelete(email)}
      >
        <CloseIcon size={14} />
      </div>
    </div>
  );
};
const GoogleEventCreateMessage = ({ message }: { message: Message }) => {
  const disabledDate: RangePickerProps['disabledDate'] = useCallback((current: dayjs.Dayjs) => {
    // Can not select days before today and today
    return current && current < dayjs().startOf('day');
  }, []);
  const { options: timeZoneOptions, parseTimezone } = useTimezoneSelect();
  const { RangePicker } = DatePicker;
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [emails, setEmails] = useState<string[]>([]);
  const [emailError, setEmailError] = useState('');
  const [dateError, setDateError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const global = getGlobal();
  const themeKey = selectTheme(global);
  useEffect(() => {
    console.log('selectedTimezone', selectedTimezone);
  }, [selectedTimezone]);
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (e.target.value) {
      setTitleError('');
    }
  }, []);
  const handleTimeZoomChange = useCallback((timeZone: string) => {
    setSelectedTimezone(timeZone);
  }, []);
  const handleTimeChange = useCallback((dates: null | (Dayjs | null)[], dateStrings: string[]) => {
    if (dates) {
      console.log('From: ', dates[0], ', to: ', dates[1]);
      console.log('From: ', dateStrings[0], ', to: ', dateStrings[1]);
      setStartDate(dateStrings[0]);
      setEndDate(dateStrings[1]);
      setDateError('');
    }
  }, []);
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);
  const handleEmailComplete = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const emailStr = e.target.value;
    if (!emailStr) {
      setEmail('');
      return;
    }
    if (validateEmail(emailStr)) {
      setEmails((prev) => [...prev, emailStr]);
      setEmail('');
      setEmailError('');
    } else {
      setEmailError('Please enter the correct email address');
    }
  }, []);
  const handleEmailEnter = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const emailStr = e.currentTarget.value;
    if (!emailStr) {
      setEmail('');
      return;
    }
    if (validateEmail(emailStr)) {
      setEmails((prev) => [...prev, emailStr]);
      setEmail('');
      setEmailError('');
    } else {
      setEmailError('Please enter the correct email address');
    }
  }, []);
  const handleDeleteEmail = useCallback((email: string) => {
    setEmails((prev) => prev.filter((item) => item !== email));
  }, []);
  const handleSubmit = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    if (!title) {
      setTitleError('Please enter the title');
      return;
    }
    if (!startDate || !endDate) {
      setDateError('Please select the date');
      return;
    }
    if (!emails.length) {
      setEmailError('Please enter the email');
      return;
    }
    setIsSubmitting(true);
    const auth = getAuthState();
    const attendees: { email: string }[] = [];
    if (emails.length) {
      emails.forEach((email) => {
        attendees.push({
          email,
        });
      });
    }
    createGoogleMeet({
      title,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      selectedTimezone,
      emails,
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      googleToken: auth?.accessToken!,
    }).then((res) => {
      eventEmitter.emit(Actions.CreateCalendarSuccess, {
        message,
        response: res,
      });
    }).catch((err) => {
      console.log(err);
    }).finally(() => {
      setIsSubmitting(false);
    });
  }, [emails, endDate, isSubmitting, message, selectedTimezone, startDate, title]);
  return (
    <ConfigProvider theme={{ algorithm: themeKey === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
      <div className="google-event-create-message px-[12px]">
        <div className="p-[10px] border border-solid border-[#D9D9D9] rounded-[16px] w-[326px] bg-white dark:bg-[#292929] dark:border-[#292929]">
          <span className="text-[14px] font-semibold mb-[16px]">Please tell me the event details. </span>
          <div className="flex flex-col gap-[8px] mb-[12px]">
            <FormLabel lable="title" />
            <Input value={title} onChange={handleTitleChange} />
            {titleError && <ErrorTip message={titleError} />}
          </div>
          <div className="flex flex-col gap-[8px] mb-[12px]">
            <FormLabel lable="time" />
            <div className="flex flex-col items-center gap-[8px]">
              <RangePicker
                disabledDate={disabledDate}
                presets={[
                  {
                    label: <span aria-label="Current Time to End of Day">Now ~ EOD</span>,
                    value: () => [dayjs(), dayjs().endOf('day')], // 5.8.0+ support function
                  },
                ]}
                showTime
                format="YYYY/MM/DD HH:mm"
                onChange={handleTimeChange}
              />
              <Select
                className="w-full"
                placeholder="Please select"
                onChange={handleTimeZoomChange}
                options={timeZoneOptions}
                value={parseTimezone(selectedTimezone)}
              />
            </div>
            {dateError && <ErrorTip message={dateError} />}
          </div>
          <div className="flex flex-col gap-[8px] mb-[12px]">
            <FormLabel lable="guests" />
            <Input
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailComplete}
              onPressEnter={handleEmailEnter}
            />
            {emailError && <ErrorTip message={emailError} />}
            {emails.length > 0 && (
              emails.map((email) => (
                <EmailItem email={email} key={email} onDelete={handleDeleteEmail} />
              ))
            )}
          </div>
          <Button
            type="primary"
            className="!bg-[#8C42F0] w-full"
            htmlType="submit"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Confirm
          </Button>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default GoogleEventCreateMessage;
