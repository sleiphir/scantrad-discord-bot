import { MangaListCommand } from "./MangaListCommand";
import { NewMangaNotificationCommand } from "./NewMangaNotificationCommand";
import { SetFeedChannelCommand } from "./SetFeedChannelCommand";
import { ShowHelperCommand } from "./ShowHelperCommand";
import { ShowUserFollowListCommand } from "./ShowUserFollowListCommand";
import { SubscriptionCommand } from "./SubscriptionCommand";
import { UnsubscriptionCommand } from "./UnsubscriptionCommand";

// Bind string to the corresponding command
const commands = {
    "setFeedChannel"        : SetFeedChannelCommand,
    "newMangaNotification"  : NewMangaNotificationCommand,
    "help"                  : ShowHelperCommand,
    "mangas"                : MangaListCommand,
    "list"                  : ShowUserFollowListCommand,
    "follow"                : SubscriptionCommand,
    "add"                   : SubscriptionCommand,
    "sub"                   : SubscriptionCommand,
    "subscribe"             : SubscriptionCommand,
    "unfollow"              : UnsubscriptionCommand,
    "remove"                : UnsubscriptionCommand,
    "unsub"                 : UnsubscriptionCommand,
    "unsubscribe"           : UnsubscriptionCommand,
};

export default commands;