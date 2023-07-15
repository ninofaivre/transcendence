export type { DmEvent } from "./routers/dms"
export type { ChanEvent } from "./routers/chans"
export type { SseEvent } from "./contract"

export { contractErrors, isContractError } from "./errors"
export { contract } from "./contract"
export {
	zDmReturn,
	zDmDiscussionElementReturn,
	zDmDiscussionEventReturn,
	zDmDiscussionMessageReturn,
} from "./routers/dms"
export {
	zUserProfileReturn,
	zMyProfileReturn,
	zUserProfilePreviewReturn,
	zUserStatus,
} from "./routers/users"
export { zFriendShipReturn } from "./routers/friends"
export { zChanInvitationReturn, zFriendInvitationReturn } from "./routers/invitations"
export {
	zCreatePublicChan,
	zCreatePrivateChan,
	zChanDiscussionEventReturn,
	zChanDiscussionElementReturn,
} from "./routers/chans"

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
//     zDmDiscussionEventReturn,
//   },
//   contract,
// };

// export default contract_module;
