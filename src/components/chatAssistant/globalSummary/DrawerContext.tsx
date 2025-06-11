/* eslint-disable no-null/no-null */
/* eslint-disable react/jsx-no-constructed-context-values */
import React, {
  createContext, useCallback, useContext, useState,
} from 'react';

export enum DrawerKey {
  PersonalizeSettings = 'PersonalizeSettings',
  OriginalMessages = 'OriginalMessages',
  CustomizationPrompt = 'CustomizationPrompt',
  ChatPicker = 'ChatPicker',
  AddTopicPanel = 'AddTopicPanel',
}

type DrawerMeta = {
  isOpen: boolean;
  drawerKey?: DrawerKey;
  drawerParams?: any;
};

type DrawerContextType = {
  isOpen: boolean;
  drawerKey?: DrawerKey;
  drawerParams?: any;
  openDrawer: (drawerKey?: DrawerKey, drawerParams?: any) => void;
  closeDrawer: () => void;
};

const DrawerContext = createContext<DrawerContextType | null>(null);

export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [drawer, setDrawer] = useState<DrawerMeta>({ isOpen: false, drawerKey: DrawerKey.PersonalizeSettings });

  const openDrawer = useCallback((drawerKey?: DrawerKey, drawerParams?: any) => {
    setDrawer({ isOpen: true, drawerKey, drawerParams });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({ isOpen: false, drawerKey: undefined, drawerParams: undefined });
  }, []);

  return (
    <DrawerContext.Provider
      value={{
        isOpen: drawer.isOpen,
        drawerKey: drawer.drawerKey,
        drawerParams: drawer.drawerParams,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawer = () => {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error('useDrawer must be used within a DrawerProvider');
  return ctx;
};
