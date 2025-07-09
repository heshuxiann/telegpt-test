import type { DeviceIconName } from './device';
import type { FontIconName } from './font';

export type CharacterIconName = 'char';
export type PlaceholderIconName = 'placeholder';
export type PortraitIconName = 'portrait-icon' | 'portrait-large-icon';

export type IconName = FontIconName | DeviceIconName | CharacterIconName | PlaceholderIconName | PortraitIconName;
