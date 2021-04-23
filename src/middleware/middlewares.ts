import { AdminMiddleware } from "./AdminMiddleware";
import { ContentIsBooleanMiddleware } from "./ContentIsBooleanMiddleware";
import { FollowListNotEmptyMiddleware } from "./FollowListNotEmptyMiddleware";
import { NotificationChannelMiddleware } from "./NotificationChannelMiddleware";
import { AtLeast3CharactersMiddleware } from "./AtLeast3CharactersMiddleware";

// Bind middlewares to the corresponding commands
const middlewares = {
    SetFeedChannelCommand:          [AdminMiddleware],
    NewMangaNotificationCommand:    [AdminMiddleware, ContentIsBooleanMiddleware],
    ShowHelperCommand:              [],
    MangaListCommand:               [],
    ShowUserFollowListCommand:      [NotificationChannelMiddleware],
    SubscriptionCommand:            [NotificationChannelMiddleware, AtLeast3CharactersMiddleware],
    UnsubscriptionCommand:          [NotificationChannelMiddleware, FollowListNotEmptyMiddleware, AtLeast3CharactersMiddleware],
};

export default middlewares;