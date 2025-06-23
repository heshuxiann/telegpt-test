// useDrawerStore.ts
import { create } from 'zustand';

export enum DrawerKey {
  PersonalizeSettings = 'PersonalizeSettings',
  OriginalMessages = 'OriginalMessages',
  CustomizationPrompt = 'CustomizationPrompt',
  ChatPicker = 'ChatPicker',
  AddTopicPanel = 'AddTopicPanel',
}

type DrawerState = {
  isOpen: boolean;
  drawerKey?: DrawerKey;
  drawerParams?: any;
  openDrawer: (drawerKey?: DrawerKey, drawerParams?: any) => void;
  closeDrawer: () => void;
};

export const useDrawerStore = create<DrawerState>((set) => ({
  isOpen: false,
  drawerKey: undefined,
  drawerParams: undefined,

  openDrawer: (drawerKey, drawerParams) => set(() => ({
    isOpen: true,
    drawerKey,
    drawerParams,
  })),

  closeDrawer: () => set(() => ({
    isOpen: false,
    drawerKey: undefined,
    drawerParams: undefined,
  })),
}));
