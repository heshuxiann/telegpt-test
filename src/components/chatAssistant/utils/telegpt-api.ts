import { TelegptFetch } from './telegpt-fetch';

// 邀请
export const getMyInvitation = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/invitation?action=get_my_invitation', 'GET')
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const submitInviteCode = (inviteCode: string): Promise<any> => {
  const params = {
    action: 'submit_invite_code',
    inviteCode,
  };
  return new Promise((resolve, reject) => {
    TelegptFetch('/invitation', 'POST', JSON.stringify(params))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getMyInviteCodes = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/invitation?action=get_my_invite_codes', 'GET')
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getAllInviteInfo = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/invitation?action=get_all_invitation_info', 'GET')
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getPointsDetail = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/invitation?action=get_points_detail', 'GET')
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

// 用户设置
export const getUserSetting = (userId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch(`/settings/personalized-settings?user_id=${userId}`, 'GET')
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const updateUserSetting = (userId: string, data: object): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch(`/settings/personalized-settings?user_id=${userId}`, 'POST', JSON.stringify(data))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const updateSummarize = (data: object): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/settings/update-summarize', 'POST', JSON.stringify(data))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
export const deleteSummarize = (userId: string, tempId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch(`/settings/update-summarize?id=${tempId}&user_id=${userId}`, 'DELETE')
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
export const updateUrgent = (data: object): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/settings/update-urgent', 'POST', JSON.stringify(data))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
export const deleteUrgent = (userId: string, tempId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch(`/settings/update-urgent?id=${tempId}&user_id=${userId}`, 'DELETE')
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

// 会员信息
export const getSubscription = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch(`/subscription`, 'GET')
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
