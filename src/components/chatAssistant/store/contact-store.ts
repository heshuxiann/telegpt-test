import type { StoreName } from './chatai-store';

import ChataiDB from './chatai-store';

interface UserInfo {
  id: string;
  name?: string;
  avatar?: string;
  phoneNumber?: string;
  tags?: string;
}
class ContactStore extends ChataiDB {
  private storeName: StoreName = 'contact';

  async getContact(id: string): Promise<UserInfo | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(id);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async addContact(contact: UserInfo) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(contact);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

export default ContactStore;
