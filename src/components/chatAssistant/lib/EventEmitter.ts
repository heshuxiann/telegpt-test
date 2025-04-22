export enum Actions {
  HideMenu = 'HideMenu',
  ShowMenu = 'ShowMenu',
  ShowTranslateModal = 'ShowTranslateModal',

  // global ai assistant
  AddNewMessageToAiAssistant = 'AddNewMessageToAiAssistant',
  // global summary
  HideGlobalSummaryModal = 'HideGlobalSummaryModal',
  ShowGlobalSummaryPanel = 'ShowGlobalSummaryPanel',
  GlobalSummaryTemplateUpdate = 'GlobalSummaryTemplateUpdate',
}
class EventEmitter {
  private static instance: EventEmitter;

  private events: { [key: string]: ((...args: any[]) => void)[] | undefined };

  constructor() {
    this.events = {};
  }

  on(event: string | number, listener: (...args: any[]) => void) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event: string | number, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach((listener: (...args: any[]) => void) => listener(...args));
    }
  }

  off(event: string | number, listener: (...args: any[]) => void) {
    if (!this.events[event]) return;

    this.events[event] = this.events[event].filter(
      (existingListener: any) => existingListener !== listener,
    );
  }

  once(event: any, listener: (arg0: any) => void) {
    const onceListener = (...args: [any]) => {
      listener(...args);
      this.off(event, onceListener);
    };
    this.on(event, onceListener);
  }

  public static getInstance(): EventEmitter {
    if (!EventEmitter.instance) {
      EventEmitter.instance = new EventEmitter();
    }
    return EventEmitter.instance;
  }
}

const eventEmitter = EventEmitter.getInstance();
export default eventEmitter;
