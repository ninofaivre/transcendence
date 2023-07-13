export type { DmEvent } from "./routers/dms";
export type { ChanEvent } from "./routers/chans";
export type { SseEvent } from "./contract";

export { contract } from "./contract";
export { zDmReturn, zDmDiscussionElementReturn } from "./routers/dms";
export { zUserProfileReturn } from "./routers/users";
export { zFriendShipReturn } from "./routers/friends";
export { zChanInvitationReturn, zFriendInvitationReturn } from "./routers/invitations";
export {
  zCreatePublicChan,
  zCreatePrivateChan,
  zChanDiscussionEventReturn,
  zChanDiscussionElementReturn,
} from "./routers/chans";

// const contract_module = {
//   zodTypes: {
//     zChanDiscussionElementReturn,
//     zChanDiscussionEventReturn,
//     zChanInvitationReturn,
//     zCreatePrivateChan,
//     zCreatePublicChan,
//     zDmDiscussionElementReturn,
//     zDmReturn,
//     zFriendInvitationReturn,
//     zFriendShipReturn,
//     zUserProfileReturn,
//   },
//   contract,
// };

// export default contract_module;
