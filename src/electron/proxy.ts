/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import { execSync } from 'child_process';

function getMacOSProxy() {
  try {
    const output = execSync('scutil --proxy', { encoding: 'utf-8' });
    const lines = output.split('\n');
    let proxyHost = '';
    let proxyPort = '';

    for (const line of lines) {
      if (line.includes('HTTPSProxy')) {
        proxyHost = line.split(':')[1].trim();
      }
      if (line.includes('HTTPSPort')) {
        proxyPort = line.split(':')[1].trim();
      }
    }

    if (proxyHost && proxyPort) {
      return `http://${proxyHost}:${proxyPort}`;
    }
  } catch (e) {
    console.error('无法读取 macOS 代理', e);
  }
  return null;
}

function getWindowsProxy() {
  try {
    const output = execSync(
      'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings"',
      { encoding: 'utf-8' },
    );

    const proxyEnable = output.match(/ProxyEnable\s+REG_DWORD\s+0x1/);
    const proxyServerMatch = output.match(/ProxyServer\s+REG_SZ\s+([^\r\n]+)/);

    if (proxyEnable && proxyServerMatch) {
      return `http://${proxyServerMatch[1].trim()}`;
    }
  } catch (e) {
    console.error('无法读取 Windows 系统代理', e);
  }
  return null;
}

function getLinuxProxy() {
  try {
    const mode = execSync(
      'gsettings get org.gnome.system.proxy mode',
      { encoding: 'utf-8' },
    ).trim().replace(/'/g, '');

    if (mode === 'none') {
      return null;
    }

    const host = execSync(
      'gsettings get org.gnome.system.proxy.https host',
      { encoding: 'utf-8' },
    ).trim().replace(/'/g, '');

    const port = execSync(
      'gsettings get org.gnome.system.proxy.https port',
      { encoding: 'utf-8' },
    ).trim();

    if (host && port !== '0') {
      return `http://${host}:${port}`;
    }
  } catch (e) {
    console.error('无法读取 Linux 系统代理', e);
  }
  return null;
}

function detectSystemProxy() {
  if (process.platform === 'darwin') {
    return getMacOSProxy();
  } else if (process.platform === 'win32') {
    return getWindowsProxy();
  } else if (process.platform === 'linux') {
    return getLinuxProxy();
  }
  return null;
}

export function initProxy() {
  const proxy = detectSystemProxy();
  if (proxy) {
    process.env.HTTPS_PROXY = proxy;
  }
}
