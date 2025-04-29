/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Button, DatePicker, Input,
} from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import { DeltaIcon } from './icons';

import CalendarIcon from './assets/calendar.png';
import DefaultAvatar from './assets/default-avatar.png';
import UserIcon from './assets/user.png';
import WriteIcon from './assets/write.png';

const FormLabel = (props:{ lable:'title' | 'time' | 'guests' }) => {
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
    }
  }, [label]);
  return (
    <div className="flex items-center gap-[8px]">
      <img src={icon} alt="" className="w-[16px] h-[16px]" />
      <span className="text-[14px] font-semibold">{title}</span>
    </div>
  );
};

const ErrorTip = ({ message }:{ message:string }) => {
  return (
    <div className="text-[12px] leading-[18px] text-red-400">{message}</div>
  );
};

const EmailItem = ({ email }:{ email:string }) => {
  return (
    <div className="flex items-center gap-[8px] py-[10px]">
      <img className="w-[24px] h-[24px] rounded-full" src={DefaultAvatar} alt="" />
      <span className="text-[14px] text-black">{email}</span>
      <div className="ml-auto">
        <DeltaIcon />
      </div>
    </div>
  );
};
const GoogleEventCreateMessage = () => {
  const disabledDate: RangePickerProps['disabledDate'] = useCallback((current: dayjs.Dayjs) => {
    // Can not select days before today and today
    return current && current < dayjs().startOf('day');
  }, []);
  const { RangePicker } = DatePicker;
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [emails, setEmails] = useState<string[]>([]);
  const [emailError, setEmailError] = useState('');
  const [dateError, setDateError] = useState('');
  const [titleError, setTitleError] = useState('');
  const validateEmail = (email:string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (e.target.value) {
      setTitleError('');
    }
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
    if (validateEmail(emailStr)) {
      setEmails((prev) => [...prev, emailStr]);
      setEmail('');
      setEmailError('');
    } else {
      setEmailError('Please enter the correct email address');
    }
  }, []);
  const handleSubmit = useCallback(() => {
    if (!title) {
      setTitleError('Please enter the title');
      return;
    }
    if (!startDate || !endDate) {
      setDateError('Please select the date');
    }
  }, [endDate, startDate, title]);
  return (
    <div className="google-event-create-message px-[12px]">
      <div className="p-[10px] border-solid border-[#D9D9D9] rounded-[16px] bg-white w-[326px]">
        <span className="text-[14px] font-semibold mb-[16px]">Please tell me the event details. </span>
        <div className="flex flex-col gap-[8px] mb-[12px]">
          <FormLabel lable="title" />
          <Input value={title} onChange={handleTitleChange} />
          {titleError && <ErrorTip message={titleError} />}
        </div>
        <div className="flex flex-col gap-[8px] mb-[12px]">
          <FormLabel lable="time" />
          <div className="flex flex-row items-center gap-[8px]">
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
              <EmailItem email={email} key={email} />
            ))
          )}
        </div>
        <Button type="primary" htmlType="submit" className="w-full" onClick={handleSubmit}>
          创建会议
        </Button>
      </div>
    </div>
  );
};

export default GoogleEventCreateMessage;
