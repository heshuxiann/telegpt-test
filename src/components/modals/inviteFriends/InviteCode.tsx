import React, { useEffect, useState } from 'react';
import type { TableColumnsType } from 'antd';
import { ConfigProvider, Table, theme } from 'antd';
import cx from 'classnames';
import copy from 'copy-to-clipboard';
import { getActions, getGlobal } from '../../../global';

import { selectTheme } from '../../../global/selectors';
import { getMyInviteCodes } from '../../chatAssistant/utils/telegpt-api';
import { formatPostgresTimestamp } from '../../chatAssistant/utils/util';

import Icon from '../../chatAssistant/component/Icon';

interface DataType {
  key: React.Key;
  inviteCode: string;
  invitedUser: string;
  invitedUserName: string;
  points: number;
  invitedAt: string;
  status: 'available' | 'used';
}

export const InviteCode = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(10);
  const [inviteCodes, setInviteCodes] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const { defaultAlgorithm, darkAlgorithm } = theme;
  const global = getGlobal();
  const systemTheme = selectTheme(global);
  const handleCopy = (code: string) => {
    copy(code);
    getActions().showNotification({
      message: 'TextCopied',
    });
  };
  const columns: TableColumnsType<DataType> = [
    {
      title: 'Code',
      dataIndex: 'inviteCode',
      key: 'inviteCode',
      render: (value: string, record: DataType) => {
        return (
          <div
            className={cx('w-[100px] h-[36px] text-white text-[14px] flex items-center justify-center gap-[6px] rounded-[8px] bg-[#369CFF]', {
              'bg-[#D6D6D6]': record.status === 'used',
            })}
            onClick={() => handleCopy(value)}
          >
            <span>{value}</span>
            <Icon name="copy" className="cursor-pointer text-[18px]" />
          </div>
        );
      },
    },
    {
      title: 'Invitees',
      dataIndex: 'invitedUserName',
      key: 'invitedUserName',
    },
    {
      title: 'Credits',
      dataIndex: 'points',
      key: 'points',
      render: (value: number) => {
        return value ? value : '';
      },
    },
    {
      title: 'Time',
      dataIndex: 'invitedAt',
      key: 'invitedAt',
      render: (value: string) => {
        if (value) {
          return formatPostgresTimestamp(value);
        }
        return '';
      },
    },
  ];

  const getCodeList = async (page: number) => {
    const res = await getMyInviteCodes(page);
    setLoading(false);
    const { records, pagination } = res.data;
    if (pagination.total > 0) {
      setTotal(pagination.total);
      setCurrentPage(page);
    }
    if (records.length > 0) {
      setInviteCodes(records);
    }
  };

  const onChange = (page: number) => {
    setLoading(true);
    getCodeList(page);
  };

  useEffect(() => {
    getCodeList(1);
  }, []);

  return (
    <ConfigProvider theme={{
      algorithm: systemTheme === 'dark' ? darkAlgorithm : defaultAlgorithm,
    }}
    >
      <Table<DataType>
        columns={columns}
        dataSource={inviteCodes}
        loading={loading}
        pagination={{
          showSizeChanger: false,
          current: currentPage,
          pageSize: 10,
          total,
          onChange,
        }}
      />
    </ConfigProvider>
  );
};
