/* eslint-disable no-mixed-operators */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-len */
/* eslint-disable no-return-assign */
/* eslint-disable no-cond-assign */
/* eslint-disable no-null/no-null */
import { useMemo } from 'react';
import spacetime from 'spacetime';
import soft from 'timezone-soft';

// type ICustomTimezone = {
//   [key: string]: string;
// };

// type ILabelStyle = 'original' | 'altName' | 'abbrev' | 'offsetHidden';
// type IDisplayValue = 'GMT' | 'UTC';
type ITimezoneOption = {
  value: string;
  label: string;
  abbrev?: string;
  altName?: string;
  offset?: number;
};
type ITimezone = ITimezoneOption | string;

const allTimezones = {
  'Pacific/Midway': 'Midway Island, Samoa',
  'Pacific/Honolulu': 'Hawaii',
  'America/Juneau': 'Alaska',
  'America/Boise': 'Mountain Time',
  'America/Dawson': 'Dawson, Yukon',
  'America/Chihuahua': 'Chihuahua, La Paz, Mazatlan',
  'America/Phoenix': 'Arizona',
  'America/Chicago': 'Central Time',
  'America/Regina': 'Saskatchewan',
  'America/Mexico_City': 'Guadalajara, Mexico City, Monterrey',
  'America/Belize': 'Central America',
  'America/Detroit': 'Eastern Time',
  'America/Bogota': 'Bogota, Lima, Quito',
  'America/Caracas': 'Caracas, La Paz',
  'America/Santiago': 'Santiago',
  'America/St_Johns': 'Newfoundland and Labrador',
  'America/Sao_Paulo': 'Brasilia',
  'America/Tijuana': 'Tijuana',
  'America/Montevideo': 'Montevideo',
  'America/Argentina/Buenos_Aires': 'Buenos Aires, Georgetown',
  'America/Godthab': 'Greenland',
  'America/Los_Angeles': 'Pacific Time',
  'Atlantic/Azores': 'Azores',
  'Atlantic/Cape_Verde': 'Cape Verde Islands',
  GMT: 'UTC',
  'Europe/London': 'Edinburgh, London',
  'Europe/Dublin': 'Dublin',
  'Europe/Lisbon': 'Lisbon',
  'Africa/Casablanca': 'Casablanca, Monrovia',
  'Atlantic/Canary': 'Canary Islands',
  'Europe/Belgrade': 'Belgrade, Bratislava, Budapest, Ljubljana, Prague',
  'Europe/Sarajevo': 'Sarajevo, Skopje, Warsaw, Zagreb',
  'Europe/Brussels': 'Brussels, Copenhagen, Madrid, Paris',
  'Europe/Amsterdam': 'Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna',
  'Africa/Algiers': 'West Central Africa',
  'Europe/Bucharest': 'Bucharest',
  'Africa/Cairo': 'Cairo',
  'Europe/Helsinki': 'Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius',
  'Europe/Athens': 'Athens',
  'Asia/Jerusalem': 'Jerusalem',
  'Africa/Harare': 'Harare, Pretoria',
  'Europe/Moscow': 'Istanbul, Minsk, Moscow, St. Petersburg, Volgograd',
  'Asia/Kuwait': 'Kuwait, Riyadh',
  'Africa/Nairobi': 'Nairobi',
  'Asia/Baghdad': 'Baghdad',
  'Asia/Tehran': 'Tehran',
  'Asia/Dubai': 'Abu Dhabi, Muscat',
  'Asia/Baku': 'Baku, Tbilisi, Yerevan',
  'Asia/Kabul': 'Kabul',
  'Asia/Yekaterinburg': 'Ekaterinburg',
  'Asia/Karachi': 'Islamabad, Karachi, Tashkent',
  'Asia/Kolkata': 'Chennai, Kolkata, Mumbai, New Delhi',
  'Asia/Kathmandu': 'Kathmandu',
  'Asia/Dhaka': 'Astana, Dhaka',
  'Asia/Colombo': 'Sri Jayawardenepura',
  'Asia/Almaty': 'Almaty, Novosibirsk',
  'Asia/Rangoon': 'Yangon Rangoon',
  'Asia/Bangkok': 'Bangkok, Hanoi, Jakarta',
  'Asia/Krasnoyarsk': 'Krasnoyarsk',
  'Asia/Shanghai': 'Beijing, Chongqing, Hong Kong SAR, Urumqi',
  'Asia/Kuala_Lumpur': 'Kuala Lumpur, Singapore',
  'Asia/Taipei': 'Taipei',
  'Australia/Perth': 'Perth',
  'Asia/Irkutsk': 'Irkutsk, Ulaanbaatar',
  'Asia/Seoul': 'Seoul',
  'Asia/Tokyo': 'Osaka, Sapporo, Tokyo',
  'Asia/Yakutsk': 'Yakutsk',
  'Australia/Darwin': 'Darwin',
  'Australia/Adelaide': 'Adelaide',
  'Australia/Sydney': 'Canberra, Melbourne, Sydney',
  'Australia/Brisbane': 'Brisbane',
  'Australia/Hobart': 'Hobart',
  'Asia/Vladivostok': 'Vladivostok',
  'Pacific/Guam': 'Guam, Port Moresby',
  'Asia/Magadan': 'Magadan, Solomon Islands, New Caledonia',
  'Asia/Kamchatka': 'Kamchatka, Marshall Islands',
  'Pacific/Fiji': 'Fiji Islands',
  'Pacific/Auckland': 'Auckland, Wellington',
  'Pacific/Tongatapu': "Nuku'alofa",
};

// src/index.tsx
export function useTimezoneSelect() {
  const timezones = allTimezones;
  const displayValue = 'GMT';
  const options = useMemo(() => {
    return Object.entries(timezones).map((zone) => {
      let _a; let _b; let _c; let
        _d;
      try {
        const now = spacetime.now().goto(zone[0]);
        const isDstString = now.isDST() ? 'daylight' : 'standard';
        const tz = now.timezone();
        const tzStrings = soft(zone[0]);
        const abbr = (_b = (_a = tzStrings == null ? void 0 : tzStrings[0]) == null ? void 0 : _a[isDstString]) == null ? void 0 : _b.abbr;
        const altName = (_d = (_c = tzStrings == null ? void 0 : tzStrings[0]) == null ? void 0 : _c[isDstString]) == null ? void 0 : _d.name;
        const min = tz.current.offset * 60;
        const hr = `${Math.floor(min / 60)}:${min % 60 === 0 ? '00' : Math.abs(min % 60)}`;
        const prefix = `(${displayValue}${hr.includes('-') ? hr : `+${hr}`}) ${zone[1]}`;
        return {
          value: tz.name,
          label: prefix,
          offset: tz.current.offset,
          abbrev: abbr,
          altName,
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean).sort((a, b) => a.offset - b.offset);
  }, [timezones]);
  const findFuzzyTz = (zone:any) => {
    let _a;
    let _b;
    let currentTime;
    try {
      currentTime = spacetime.now().goto(zone);
    } catch (err) {
      currentTime = spacetime.now().goto('GMT');
    }
    return (_b = (_a = options.filter((tz:any) => tz.offset === currentTime.timezone().current.offset).map((tz:any) => {
      let score = 0;
      if (currentTime.timezones[tz.value.toLowerCase()] && !!currentTime.timezones[tz.value.toLowerCase()].dst === currentTime.timezone().hasDst) {
        if (tz.value.toLowerCase().indexOf(currentTime.tz.substring(currentTime.tz.indexOf('/') + 1)) !== -1) {
          score += 8;
        }
        if (tz.label.toLowerCase().indexOf(currentTime.tz.substring(currentTime.tz.indexOf('/') + 1)) !== -1) {
          score += 4;
        }
        if (tz.value.toLowerCase().indexOf(currentTime.tz.substring(0, currentTime.tz.indexOf('/'))) !== -1) {
          score += 2;
        }
        score += 1;
      } else if (tz.value === 'GMT') {
        score += 1;
      }
      return { tz, score };
    }).sort((a, b) => b.score - a.score)) == null ? void 0 : _a[0]) == null ? void 0 : _b.tz;
  };
  function isObject(item:any) {
    return typeof item === 'object' && !Array.isArray(item) && item !== null;
  }
  const parseTimezone = (zone:ITimezone) => {
    if (typeof zone === 'string') {
      return options.find((tz:any) => tz.value === zone) || zone.indexOf('/') !== -1 && findFuzzyTz(zone);
    } else if (isObject(zone) && !zone.label) {
      return options.find((tz:any) => tz.value === zone.value);
    } else {
      return zone;
    }
  };
  return { options, parseTimezone };
}
