import { withGlobal } from "../../global"
import { isChatAdmin, isChatChannel, isChatGroup, isUserBot } from "../../global/helpers"
import { selectChat, selectTheme, selectUser } from "../../global/selectors"
import { selectSharedSettings } from "../../global/selectors/sharedState"
import { FC, memo } from "../../lib/teact/teact"
import { ProfileState, ThemeKey, ThreadId } from "../../types"

type OwnProps = {
  chatId?: string;
  isActive: boolean;
};
type StateProps = {
  theme: ThemeKey
}

const PortraitPanel: FC<OwnProps & StateProps> = () => {
  return <div></div>
}

export default memo(withGlobal<OwnProps>(
  (global, {
    chatId
  }): StateProps => {

    return {
      theme: selectTheme(global),

    };
  },
)(PortraitPanel));
