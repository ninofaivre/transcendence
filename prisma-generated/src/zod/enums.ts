import { z } from "zod";

export const zPermissionList = z.enum([
  "SEND_MESSAGE",
  "DELETE_MESSAGE",
  "EDIT",
  "INVITE",
  "KICK",
  "BAN",
  "MUTE",
  "DESTROY"
]);

export const PermissionList = {
  SEND_MESSAGE: 'SEND_MESSAGE',
  DELETE_MESSAGE: 'DELETE_MESSAGE',
  EDIT: 'EDIT',
  INVITE: 'INVITE',
  KICK: 'KICK',
  BAN: 'BAN',
  MUTE: 'MUTE',
  DESTROY: 'DESTROY',
} as const;

export const zRoleApplyingType = z.enum([
  "NONE",
  "ROLES",
  "ROLES_AND_SELF"
]);

export const RoleApplyingType = {
  NONE: 'NONE',
  ROLES: 'ROLES',
  ROLES_AND_SELF: 'ROLES_AND_SELF',
} as const;

export const zFriendInvitationStatus = z.enum([
  "PENDING",
  "ACCEPTED",
  "REFUSED",
  "CANCELED",
  "BLOCKED_USER"
]);

export const FriendInvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REFUSED: 'REFUSED',
  CANCELED: 'CANCELED',
  BLOCKED_USER: 'BLOCKED_USER',
} as const;

export const zChanInvitationStatus = z.enum([
  "PENDING",
  "ACCEPTED",
  "REFUSED",
  "CANCELED",
  "DELETED_CHAN",
  "BLOCKED_USER",
  "BANNED_FROM_CHAN"
]);

export const ChanInvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REFUSED: 'REFUSED',
  CANCELED: 'CANCELED',
  DELETED_CHAN: 'DELETED_CHAN',
  BLOCKED_USER: 'BLOCKED_USER',
  BANNED_FROM_CHAN: 'BANNED_FROM_CHAN',
} as const;

export const zStatusVisibilityLevel = z.enum([
  "NO_ONE",
  "ONLY_FRIEND",
  "IN_COMMON_CHAN",
  "ANYONE"
]);

export const StatusVisibilityLevel = {
  NO_ONE: 'NO_ONE',
  ONLY_FRIEND: 'ONLY_FRIEND',
  IN_COMMON_CHAN: 'IN_COMMON_CHAN',
  ANYONE: 'ANYONE',
} as const;

export const zDmPolicyLevelType = z.enum([
  "ONLY_FRIEND",
  "IN_COMMON_CHAN",
  "ANYONE"
]);

export const DmPolicyLevelType = {
  ONLY_FRIEND: 'ONLY_FRIEND',
  IN_COMMON_CHAN: 'IN_COMMON_CHAN',
  ANYONE: 'ANYONE',
} as const;

export const zDirectMessageStatus = z.enum([
  "ENABLED",
  "DISABLED"
]);

export const DirectMessageStatus = {
  ENABLED: 'ENABLED',
  DISABLED: 'DISABLED',
} as const;

export const zClassicDmEventType = z.enum([
  "CREATED_FRIENDSHIP",
  "DELETED_FRIENDSHIP"
]);

export const ClassicDmEventType = {
  CREATED_FRIENDSHIP: 'CREATED_FRIENDSHIP',
  DELETED_FRIENDSHIP: 'DELETED_FRIENDSHIP',
} as const;

export const zChanType = z.enum([
  "PUBLIC",
  "PRIVATE"
]);

export const ChanType = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
} as const;

export const zClassicChanEventType = z.enum([
  "AUTHOR_LEAVED",
  "AUTHOR_KICKED_CONCERNED",
  "AUTHOR_JOINED",
  "AUTHOR_MUTED_CONCERNED"
]);

export const ClassicChanEventType = {
  AUTHOR_LEAVED: 'AUTHOR_LEAVED',
  AUTHOR_KICKED_CONCERNED: 'AUTHOR_KICKED_CONCERNED',
  AUTHOR_JOINED: 'AUTHOR_JOINED',
  AUTHOR_MUTED_CONCERNED: 'AUTHOR_MUTED_CONCERNED',
} as const;
