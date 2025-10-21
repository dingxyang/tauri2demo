import { type as osType } from "@tauri-apps/plugin-os";

const OS_TYPE = await osType();

export const isWindows = OS_TYPE === 'windows';
export const isMac = OS_TYPE === 'macos';
export const isLinux = OS_TYPE === 'linux';
export const isAndroid = OS_TYPE === 'android';
export const isIOS = OS_TYPE === 'ios';

export const isDesktop = isWindows || isMac || isLinux;

// 移动端需要考虑 safe area insets
export const isMobile = isAndroid || isIOS;
