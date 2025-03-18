import React, { useEffect, useState } from 'react';
import {
  Button, Form, Input, Modal,
} from 'antd';

import { CHATAI_STORE } from '../store';

import useLastCallback from '../../../hooks/useLastCallback';

const { TextArea } = Input;

interface Iprops {
  userId: string;
  tagsModalVisable: boolean;
  close:()=>void;
}
interface UserInfo {
  id: string;
  name?: string;
  phoneNumber?: string;
  tags?:string;
}
const TagsModal = (props: Iprops) => {
  const { userId, tagsModalVisable, close } = props;

  const [form] = Form.useForm();
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  useEffect(() => {
    if (userId) {
      CHATAI_STORE.UsersStore.getUser(userId).then((user) => {
        if (user) {
          setUserInfo(user);
          form.setFieldsValue({
            name: user.name,
            phoneNumber: user.phoneNumber,
            tags: user?.tags,
          });
        }
      });
    }
  }, [userId, form]);
  const handleSubmit = useLastCallback(() => {
    // eslint-disable-next-line no-console
    console.log(form);
    CHATAI_STORE.UsersStore.addUser({
      ...userInfo,
      tags: form.getFieldValue('tags'),
    });
    close();
  });
  return (
    <Modal
      title="添加用户标签"
      open={tagsModalVisable}
      // eslint-disable-next-line react/jsx-no-bind
      onOk={handleSubmit}
      // eslint-disable-next-line react/jsx-no-bind
      onCancel={close}
      destroyOnClose
      zIndex={9999}
    >
      <Form name="trigger" layout="vertical" autoComplete="off" form={form}>
        <Form.Item
          label="username"
          name="name"
        >
          <Input disabled />
        </Form.Item>
        <Form.Item
          label="phone"
          name="phoneNumber"
        >
          <Input disabled />
        </Form.Item>
        <Form.Item
          label="tags"
          name="tags"
        >
          <TextArea value={userInfo?.tags} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TagsModal;
