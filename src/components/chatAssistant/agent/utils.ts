export function getDeviceId() {
  let deviceId = localStorage.getItem('telegpt-device-id');
  if (!deviceId) {
    deviceId = `web-deviceid-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    localStorage.setItem('telegpt-device-id', deviceId);
  }
  return deviceId;
}