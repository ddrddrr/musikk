from enum import StrEnum


class ServerEvent(StrEnum):
    USER_UPDATED = "user.updated"
    USER_FOLLOWED = "user.followed"
    USER_UNFOLLOWED = "user.unfollowed"
