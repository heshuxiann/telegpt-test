/* eslint-disable no-console */
import type { StoreName } from './chatai-store';

import ChataiDB from './chatai-store';

export interface CustomSummaryTemplate {
  id: string;
  title: string;
  prompt: string;
}

class SummaryTemplateStore extends ChataiDB {
  private storeName: StoreName = 'summaryTemplate';

  async getAllSummaryTemplate(): Promise<CustomSummaryTemplate[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getSummaryTemplate(id: string): Promise<CustomSummaryTemplate> {
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

  async deleteSummaryTemplate(id: string):Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log(`Deleted record with key: ${id}`);
        resolve();
      };
      request.onerror = () => reject(new Error('Failed to delete record'));
    });
  }

  async addSummaryTemplate(summaryTemplate:CustomSummaryTemplate) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(summaryTemplate);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

export default SummaryTemplateStore;
