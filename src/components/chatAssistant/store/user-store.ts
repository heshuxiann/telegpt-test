import { USERINFO_IDB_STORE } from './im-assistant-idb';

interface UserInfo {
  id: string;
  name?: string;
  avatar?: string;
  phoneNumber?: string;
  tags?:string;
}
export const addUser = (contact: UserInfo) => {
  USERINFO_IDB_STORE.set(contact.id, contact);
};
export const getUser = (id: string):Promise<UserInfo | undefined> => {
  return USERINFO_IDB_STORE.get(id);
};

export const updateUser = (id: string, updater: (oldValue: UserInfo | undefined) => UserInfo) => {
  return USERINFO_IDB_STORE.update(id, updater);
};
