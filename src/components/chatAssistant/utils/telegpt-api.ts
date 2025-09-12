import { TelegptFetch } from './telegpt-fetch';

export const getMyInvitation = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/invitation?action=get_my_invitation', 'GET')
      .then((res) => res.json()).then()
      .then((toolResults) => {
        resolve(toolResults);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const submitInviteCode = (inviteCode: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/invitation', 'POST', {
      action: 'submit_invite_code',
      inviteCode,
    })
      .then((res) => res.json()).then()
      .then((toolResults) => {
        resolve(toolResults);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getMyInviteCodes = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/invitation?action=get_my_invite_codes', 'GET')
      .then((res) => res.json()).then()
      .then((toolResults) => {
        resolve(toolResults);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getAllInviteInfo = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/invitation?action=get_all_invitation_info', 'GET')
      .then((res) => res.json()).then()
      .then((toolResults) => {
        resolve(toolResults);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getPointsDetail = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/invitation?action=get_points_detail', 'GET')
      .then((res) => res.json()).then()
      .then((toolResults) => {
        resolve(toolResults);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
