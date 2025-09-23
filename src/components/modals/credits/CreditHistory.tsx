import React, { useEffect, useState } from 'react';
import type { TableColumnsType } from 'antd';
import { Table } from 'antd';

import { getCreditHistory } from '../../chatAssistant/utils/telegpt-api';
import { formatPostgresTimestamp } from '../../chatAssistant/utils/util';

interface DataType {
  key: React.Key;
  id: string;
  userId: string;
  amount: number;
  source: number;
  description: string;
  type: string;
  createdAt: string;
}

export const CreditHistory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(10);
  const [creditList, setCreditList] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const columns: TableColumnsType<DataType> = [
    {
      title: 'Detail',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Credits',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => formatPostgresTimestamp(value),
    },
  ];
  const getCreditHistoryList = async (page: number) => {
    const res = await getCreditHistory(page);
    setLoading(false);
    const { records, pagination } = res.data;
    if (pagination.total > 0) {
      setTotal(pagination.total);
      setCurrentPage(page);
    }
    if (records.length > 0) {
      setCreditList(records);
    }
  };

  const onChange = (page: number) => {
    setLoading(true);
    getCreditHistoryList(page);
  };

  useEffect(() => {
    getCreditHistoryList(1);
  }, []);

  return (
    <Table<DataType>
      columns={columns}
      dataSource={creditList}
      loading={loading}
      pagination={{
        current: currentPage,
        pageSize: 10,
        total,
        onChange,
      }}
    />
  );
};
