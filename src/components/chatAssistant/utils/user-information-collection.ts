import { ChataiStores, USER_INFORMATION } from '../store/index';

interface IUserInformation {
  emails: string[];
  calendlyUrls: string[];
}
class UserInformationCollection {
  private userInformation: IUserInformation = {
    emails: [],
    calendlyUrls: [],
  };

  get informations() {
    return this.userInformation;
  }

  initLocalInformation() {
    ChataiStores.general?.get(USER_INFORMATION).then((res) => {
      if (res) {
        this.userInformation = res;
      }
    });
  }

  collectInformation(text: string) {
    const { emails, calendlyUrls } = this.userInformation;
    const emailRegex = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/;
    const calendlyRegex = /https?:\/\/calendly\.com\/([\w-]+)\/(\d+)min/;

    const emailMatch = text.match(emailRegex);
    const calendlyMatch = text.match(calendlyRegex);

    if (emailMatch && !emails.includes(emailMatch[0])) {
      this.setInfoOption({ emails: [...emails, emailMatch[0]] });
    }

    if (calendlyMatch && !calendlyUrls.includes(calendlyMatch[0])) {
      this.setInfoOption({ calendlyUrls: [...calendlyUrls, calendlyMatch[0]] });
    }
  }

  setInfoOption(newInfo: Partial<IUserInformation>) {
    this.userInformation = {
      ...this.userInformation,
      ...newInfo,
    };
    ChataiStores.general?.set(USER_INFORMATION, this.userInformation);
  }
}

export const userInformationCollection = new UserInformationCollection();
