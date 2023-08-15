import { z } from "zod";

export const PermissionList = {
  SEND_MESSAGE: 'SEND_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  DELETE_MESSAGE: 'DELETE_MESSAGE',
  EDIT: 'EDIT',
  INVITE: 'INVITE',
  KICK: 'KICK',
  BAN: 'BAN',
  MUTE: 'MUTE',
  DESTROY: 'DESTROY',
} as const;

export const FriendInvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REFUSED: 'REFUSED',
  CANCELED: 'CANCELED',
  BLOCKED_USER: 'BLOCKED_USER',
} as const;

export const ChanInvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REFUSED: 'REFUSED',
  CANCELED: 'CANCELED',
  DELETED_CHAN: 'DELETED_CHAN',
  BLOCKED_USER: 'BLOCKED_USER',
  BANNED_FROM_CHAN: 'BANNED_FROM_CHAN',
} as const;

export const AccessPolicyLevel = {
  NO_ONE: 'NO_ONE',
  ONLY_FRIEND: 'ONLY_FRIEND',
  IN_COMMON_CHAN: 'IN_COMMON_CHAN',
  ANYONE: 'ANYONE',
} as const;

export const DirectMessageStatus = {
  ENABLED: 'ENABLED',
  DISABLED: 'DISABLED',
} as const;

export const ClassicDmEventType = {
  CREATED_FRIENDSHIP: 'CREATED_FRIENDSHIP',
  DELETED_FRIENDSHIP: 'DELETED_FRIENDSHIP',
} as const;

export const TimedStatusType = {
  MUTE: 'MUTE',
  BAN: 'BAN',
} as const;

export const ChanType = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
} as const;

export const ClassicChanEventType = {
  AUTHOR_LEAVED: 'AUTHOR_LEAVED',
  AUTHOR_KICKED_CONCERNED: 'AUTHOR_KICKED_CONCERNED',
  AUTHOR_JOINED: 'AUTHOR_JOINED',
} as const;

export const zPermissionList = z.enum([
  "SEND_MESSAGE",
  "UPDATE_MESSAGE",
  "DELETE_MESSAGE",
  "EDIT",
  "INVITE",
  "KICK",
  "BAN",
  "MUTE",
  "DESTROY",
]);

export const zFriendInvitationStatus = z.enum([
  "PENDING",
  "ACCEPTED",
  "REFUSED",
  "CANCELED",
  "BLOCKED_USER",
]);

export const zChanInvitationStatus = z.enum([
  "PENDING",
  "ACCEPTED",
  "REFUSED",
  "CANCELED",
  "DELETED_CHAN",
  "BLOCKED_USER",
  "BANNED_FROM_CHAN",
]);

export const zAccessPolicyLevel = z.enum([
  "NO_ONE",
  "ONLY_FRIEND",
  "IN_COMMON_CHAN",
  "ANYONE",
]);

export const zDirectMessageStatus = z.enum([
  "ENABLED",
  "DISABLED",
]);

export const zClassicDmEventType = z.enum([
  "CREATED_FRIENDSHIP",
  "DELETED_FRIENDSHIP",
]);

export const zTimedStatusType = z.enum([
  "MUTE",
  "BAN",
]);

export const zChanType = z.enum([
  "PUBLIC",
  "PRIVATE",
]);

export const zClassicChanEventType = z.enum([
  "AUTHOR_LEAVED",
  "AUTHOR_KICKED_CONCERNED",
  "AUTHOR_JOINED",
]);
