import SummaryTemplateStore from './chatai-summary-template-store';
import ContactStore from './contact-store';
import GeneralStore from './general-store';
import KnowledgeStore from './knowledge-store';
import MessageStore from './messages-store';
import UsersStore from './user-store';

const dbVersion = 7;

export const GLOBAL_SUMMARY_LAST_TIME = 'globalSummaryLastTime';
export const GLOBAL_SUMMARY_READ_TIME = 'globalSummaryReadTime';

export const ChataiMessageStore = new MessageStore(dbVersion);
export const ChataiContactStore = new ContactStore(dbVersion);
export const ChataiUserStore = new UsersStore(dbVersion);
export const ChataiGeneralStore = new GeneralStore(dbVersion);
export const ChataiKnowledgelStore = new KnowledgeStore(dbVersion);
export const ChataiSummaryTemplateStore = new SummaryTemplateStore(dbVersion);
(window as any).downloadAllSummarys = () => {
  ChataiMessageStore.getAllMessages().then((res) => {
    const content = JSON.stringify(res);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    // 3. 创建下载链接并触发点击
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'summarys.txt'; // 设置下载文件名
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  });
};
(window as any).ChataiMessageStore = ChataiMessageStore;
