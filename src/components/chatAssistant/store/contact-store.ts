import { CONTACT_IDB_STORE } from './im-assistant-idb';

interface UserInfo {
  id: string;
  name?: string;
  avatar?: string;
  phoneNumber?: string;
  tags?: string;
}
export const addContact = (contact: UserInfo) => {
  CONTACT_IDB_STORE.set(contact.id, contact);
};
export const getContact = (id: string):Promise<UserInfo | undefined> => {
  return CONTACT_IDB_STORE.get(id);
};
