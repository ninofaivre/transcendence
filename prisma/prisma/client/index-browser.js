
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum
} = require('./runtime/index-browser')


const Prisma = {}

exports.Prisma = Prisma

/**
 * Prisma Client JS version: 4.15.0
 * Query Engine version: 8fbc245156db7124f997f4cecdd8d1219e360944
 */
Prisma.prismaVersion = {
  client: "4.15.0",
  engine: "8fbc245156db7124f997f4cecdd8d1219e360944"
}

Prisma.PrismaClientKnownRequestError = () => {
  throw new Error(`PrismaClientKnownRequestError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  throw new Error(`PrismaClientUnknownRequestError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.PrismaClientRustPanicError = () => {
  throw new Error(`PrismaClientRustPanicError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.PrismaClientInitializationError = () => {
  throw new Error(`PrismaClientInitializationError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.PrismaClientValidationError = () => {
  throw new Error(`PrismaClientValidationError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.NotFoundError = () => {
  throw new Error(`NotFoundError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  throw new Error(`sqltag is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.empty = () => {
  throw new Error(`empty is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.join = () => {
  throw new Error(`join is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.raw = () => {
  throw new Error(`raw is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.validator = () => (val) => val


/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}

/**
 * Enums
 */

exports.Prisma.BlockedShipScalarFieldEnum = {
  id: 'id',
  creationDate: 'creationDate',
  modificationDate: 'modificationDate',
  blockingUserName: 'blockingUserName',
  blockedUserName: 'blockedUserName'
};

exports.Prisma.ChanDiscussionElementScalarFieldEnum = {
  id: 'id',
  messageId: 'messageId',
  eventId: 'eventId',
  authorName: 'authorName',
  creationDate: 'creationDate',
  modificationDate: 'modificationDate',
  chanId: 'chanId'
};

exports.Prisma.ChanDiscussionEventScalarFieldEnum = {
  id: 'id',
  concernedUserName: 'concernedUserName',
  classicChanDiscussionEventId: 'classicChanDiscussionEventId',
  changedTitleChanDiscussionEventId: 'changedTitleChanDiscussionEventId',
  deletedMessageChanDiscussionEventId: 'deletedMessageChanDiscussionEventId'
};

exports.Prisma.ChanDiscussionMessageScalarFieldEnum = {
  id: 'id',
  content: 'content',
  relatedTo: 'relatedTo'
};

exports.Prisma.ChanInvitationDmDiscussionEventScalarFieldEnum = {
  id: 'id',
  chanInvitationId: 'chanInvitationId'
};

exports.Prisma.ChanInvitationScalarFieldEnum = {
  id: 'id',
  creationDate: 'creationDate',
  modificationDate: 'modificationDate',
  chanId: 'chanId',
  chanTitle: 'chanTitle',
  invitingUserName: 'invitingUserName',
  invitedUserName: 'invitedUserName',
  status: 'status'
};

exports.Prisma.ChanScalarFieldEnum = {
  id: 'id',
  type: 'type',
  title: 'title',
  password: 'password',
  creationDate: 'creationDate',
  modificationDate: 'modificationDate',
  ownerName: 'ownerName'
};

exports.Prisma.ChangedTitleChanDiscussionEventScalarFieldEnum = {
  id: 'id',
  oldTitle: 'oldTitle',
  newTitle: 'newTitle'
};

exports.Prisma.ClassicChanDiscussionEventScalarFieldEnum = {
  id: 'id',
  eventType: 'eventType'
};

exports.Prisma.ClassicDmDiscussionEventScalarFieldEnum = {
  id: 'id',
  eventType: 'eventType'
};

exports.Prisma.DeletedMessageChanDiscussionEventScalarFieldEnum = {
  id: 'id',
  deletingUserName: 'deletingUserName'
};

exports.Prisma.DirectMessageScalarFieldEnum = {
  id: 'id',
  creationDate: 'creationDate',
  modificationDate: 'modificationDate',
  requestingUserName: 'requestingUserName',
  requestingUserStatus: 'requestingUserStatus',
  requestingUserStatusMutedUntil: 'requestingUserStatusMutedUntil',
  requestedUserName: 'requestedUserName',
  requestedUserStatus: 'requestedUserStatus',
  requestedUserStatusMutedUntil: 'requestedUserStatusMutedUntil',
  status: 'status'
};

exports.Prisma.DmDiscussionElementScalarFieldEnum = {
  id: 'id',
  messageId: 'messageId',
  eventId: 'eventId',
  author: 'author',
  creationDate: 'creationDate',
  modificationDate: 'modificationDate',
  directMessageId: 'directMessageId'
};

exports.Prisma.DmDiscussionEventScalarFieldEnum = {
  id: 'id',
  classicDmDiscussionEventId: 'classicDmDiscussionEventId',
  chanInvitationDmDiscussionEventId: 'chanInvitationDmDiscussionEventId'
};

exports.Prisma.DmDiscussionMessageScalarFieldEnum = {
  id: 'id',
  content: 'content',
  relatedTo: 'relatedTo'
};

exports.Prisma.FriendInvitationScalarFieldEnum = {
  id: 'id',
  creationDate: 'creationDate',
  modificationDate: 'modificationDate',
  invitingUserName: 'invitingUserName',
  invitedUserName: 'invitedUserName',
  status: 'status'
};

exports.Prisma.FriendShipScalarFieldEnum = {
  id: 'id',
  creationDate: 'creationDate',
  modificationDate: 'modificationDate',
  requestingUserName: 'requestingUserName',
  requestedUserName: 'requestedUserName'
};

exports.Prisma.MutedUserChanScalarFieldEnum = {
  id: 'id',
  creationDate: 'creationDate',
  untilDate: 'untilDate',
  mutedUserName: 'mutedUserName',
  chanId: 'chanId'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.RoleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  permissions: 'permissions',
  roleApplyOn: 'roleApplyOn',
  chanId: 'chanId'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  name: 'name',
  password: 'password',
  dmPolicyLevel: 'dmPolicyLevel'
};
exports.ChanInvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REFUSED: 'REFUSED',
  CANCELED: 'CANCELED',
  DELETED_CHAN: 'DELETED_CHAN',
  BLOCKED_USER: 'BLOCKED_USER',
  BANNED_FROM_CHAN: 'BANNED_FROM_CHAN'
};

exports.ChanType = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE'
};

exports.ClassicChanEventType = {
  AUTHOR_LEAVED: 'AUTHOR_LEAVED',
  AUTHOR_KICKED_CONCERNED: 'AUTHOR_KICKED_CONCERNED',
  AUTHOR_JOINED: 'AUTHOR_JOINED',
  AUTHOR_MUTED_CONCERNED: 'AUTHOR_MUTED_CONCERNED'
};

exports.ClassicDmEventType = {
  CREATED_FRIENDSHIP: 'CREATED_FRIENDSHIP',
  DELETED_FRIENDSHIP: 'DELETED_FRIENDSHIP',
  DELETED_MESSAGE: 'DELETED_MESSAGE',
  DISABLED_DM: 'DISABLED_DM',
  ENABLED_DM: 'ENABLED_DM'
};

exports.DirectMessageStatus = {
  ENABLED: 'ENABLED',
  DISABLED: 'DISABLED'
};

exports.DirectMessageUserStatus = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  MUTED: 'MUTED'
};

exports.FriendInvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REFUSED: 'REFUSED',
  CANCELED: 'CANCELED',
  BLOCKED_USER: 'BLOCKED_USER'
};

exports.PermissionList = {
  SEND_MESSAGE: 'SEND_MESSAGE',
  DELETE_MESSAGE: 'DELETE_MESSAGE',
  EDIT: 'EDIT',
  INVITE: 'INVITE',
  KICK: 'KICK',
  BAN: 'BAN',
  MUTE: 'MUTE',
  DESTROY: 'DESTROY'
};

exports.RoleApplyingType = {
  NONE: 'NONE',
  ROLES: 'ROLES',
  ROLES_AND_SELF: 'ROLES_AND_SELF'
};

exports.dmPolicyLevelType = {
  ONLY_FRIEND: 'ONLY_FRIEND',
  IN_COMMON_CHAN: 'IN_COMMON_CHAN',
  ANYONE: 'ANYONE'
};

exports.Prisma.ModelName = {
  Role: 'Role',
  FriendInvitation: 'FriendInvitation',
  ChanInvitation: 'ChanInvitation',
  FriendShip: 'FriendShip',
  BlockedShip: 'BlockedShip',
  User: 'User',
  DirectMessage: 'DirectMessage',
  DmDiscussionElement: 'DmDiscussionElement',
  DmDiscussionMessage: 'DmDiscussionMessage',
  DmDiscussionEvent: 'DmDiscussionEvent',
  ChanInvitationDmDiscussionEvent: 'ChanInvitationDmDiscussionEvent',
  ClassicDmDiscussionEvent: 'ClassicDmDiscussionEvent',
  Chan: 'Chan',
  MutedUserChan: 'MutedUserChan',
  ChanDiscussionElement: 'ChanDiscussionElement',
  ChanDiscussionMessage: 'ChanDiscussionMessage',
  ChanDiscussionEvent: 'ChanDiscussionEvent',
  ChangedTitleChanDiscussionEvent: 'ChangedTitleChanDiscussionEvent',
  DeletedMessageChanDiscussionEvent: 'DeletedMessageChanDiscussionEvent',
  ClassicChanDiscussionEvent: 'ClassicChanDiscussionEvent'
};

/**
 * Create the Client
 */
class PrismaClient {
  constructor() {
    throw new Error(
      `PrismaClient is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
    )
  }
}
exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
