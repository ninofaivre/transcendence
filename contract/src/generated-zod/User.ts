import { z } from "zod"
import { AccessPolicyLevel } from "./enums"
import {
	CompleteRoleInput,
	CompleteRoleOutput,
	RelatedRoleModel,
	CompleteDirectMessageInput,
	CompleteDirectMessageOutput,
	RelatedDirectMessageModel,
	CompleteChanInput,
	CompleteChanOutput,
	RelatedChanModel,
	CompleteFriendShipInput,
	CompleteFriendShipOutput,
	RelatedFriendShipModel,
	CompleteFriendInvitationInput,
	CompleteFriendInvitationOutput,
	RelatedFriendInvitationModel,
	CompleteChanInvitationInput,
	CompleteChanInvitationOutput,
	RelatedChanInvitationModel,
	CompleteBlockedShipInput,
	CompleteBlockedShipOutput,
	RelatedBlockedShipModel,
	CompleteChanDiscussionElementInput,
	CompleteChanDiscussionElementOutput,
	RelatedChanDiscussionElementModel,
	CompleteChanDiscussionEventInput,
	CompleteChanDiscussionEventOutput,
	RelatedChanDiscussionEventModel,
	CompleteDeletedMessageChanDiscussionEventInput,
	CompleteDeletedMessageChanDiscussionEventOutput,
	RelatedDeletedMessageChanDiscussionEventModel,
	CompleteMutedUserChanDiscussionEventInput,
	CompleteMutedUserChanDiscussionEventOutput,
	RelatedMutedUserChanDiscussionEventModel,
	CompleteChanDiscussionMessageInput,
	CompleteChanDiscussionMessageOutput,
	RelatedChanDiscussionMessageModel,
	CompleteDmDiscussionMessageInput,
	CompleteDmDiscussionMessageOutput,
	RelatedDmDiscussionMessageModel,
	CompleteDeletedMessageDmDiscussionEventInput,
	CompleteDeletedMessageDmDiscussionEventOutput,
	RelatedDeletedMessageDmDiscussionEventModel,
	CompleteBlockedDmDiscussionEventInput,
	CompleteBlockedDmDiscussionEventOutput,
	RelatedBlockedDmDiscussionEventModel,
	CompleteTimedStatusUserChanInput,
	CompleteTimedStatusUserChanOutput,
	RelatedTimedStatusUserChanModel,
} from "./index"

export const UserModel = z.object({
	name: z.string(),
	password: z.string(),
	profilePicture: z.string(),
	dmPolicyLevel: z.nativeEnum(AccessPolicyLevel),
	statusVisibilityLevel: z.nativeEnum(AccessPolicyLevel),
})

export interface CompleteUserInput extends z.input<typeof UserModel> {
	roles: CompleteRoleInput[]
	directMessage: CompleteDirectMessageInput[]
	directMessageOf: CompleteDirectMessageInput[]
	chans: CompleteChanInput[]
	ownedChans: CompleteChanInput[]
	friend: CompleteFriendShipInput[]
	friendOf: CompleteFriendShipInput[]
	outcomingFriendInvitation: CompleteFriendInvitationInput[]
	incomingFriendInvitation: CompleteFriendInvitationInput[]
	outcomingChanInvitation: CompleteChanInvitationInput[]
	incomingChanInvitation: CompleteChanInvitationInput[]
	blockedUser: CompleteBlockedShipInput[]
	blockedByUser: CompleteBlockedShipInput[]
	chanDiscussionElement: CompleteChanDiscussionElementInput[]
	chanDiscussionEvent: CompleteChanDiscussionEventInput[]
	deletedMessageChanDiscussionEvent: CompleteDeletedMessageChanDiscussionEventInput[]
	mutedChanDiscussionEvent: CompleteMutedUserChanDiscussionEventInput[]
	chanDiscussionMessage: CompleteChanDiscussionMessageInput[]
	dmDiscussionMesssage: CompleteDmDiscussionMessageInput[]
	deletedMessageDmDiscussionEvent: CompleteDeletedMessageDmDiscussionEventInput[]
	blockedDmDiscussionEvent_Blocked: CompleteBlockedDmDiscussionEventInput[]
	blockedDmDiscussionEvent_Blocking: CompleteBlockedDmDiscussionEventInput[]
	timedUserChan: CompleteTimedStatusUserChanInput[]
}

export interface CompleteUserOutput extends z.infer<typeof UserModel> {
	roles: CompleteRoleOutput[]
	directMessage: CompleteDirectMessageOutput[]
	directMessageOf: CompleteDirectMessageOutput[]
	chans: CompleteChanOutput[]
	ownedChans: CompleteChanOutput[]
	friend: CompleteFriendShipOutput[]
	friendOf: CompleteFriendShipOutput[]
	outcomingFriendInvitation: CompleteFriendInvitationOutput[]
	incomingFriendInvitation: CompleteFriendInvitationOutput[]
	outcomingChanInvitation: CompleteChanInvitationOutput[]
	incomingChanInvitation: CompleteChanInvitationOutput[]
	blockedUser: CompleteBlockedShipOutput[]
	blockedByUser: CompleteBlockedShipOutput[]
	chanDiscussionElement: CompleteChanDiscussionElementOutput[]
	chanDiscussionEvent: CompleteChanDiscussionEventOutput[]
	deletedMessageChanDiscussionEvent: CompleteDeletedMessageChanDiscussionEventOutput[]
	mutedChanDiscussionEvent: CompleteMutedUserChanDiscussionEventOutput[]
	chanDiscussionMessage: CompleteChanDiscussionMessageOutput[]
	dmDiscussionMesssage: CompleteDmDiscussionMessageOutput[]
	deletedMessageDmDiscussionEvent: CompleteDeletedMessageDmDiscussionEventOutput[]
	blockedDmDiscussionEvent_Blocked: CompleteBlockedDmDiscussionEventOutput[]
	blockedDmDiscussionEvent_Blocking: CompleteBlockedDmDiscussionEventOutput[]
	timedUserChan: CompleteTimedStatusUserChanOutput[]
}

/**
 * RelatedUserModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedUserModel: z.ZodSchema<CompleteUserOutput, z.ZodTypeDef, CompleteUserInput> =
	z.lazy(() =>
		UserModel.extend({
			roles: RelatedRoleModel.array(),
			directMessage: RelatedDirectMessageModel.array(),
			directMessageOf: RelatedDirectMessageModel.array(),
			chans: RelatedChanModel.array(),
			ownedChans: RelatedChanModel.array(),
			friend: RelatedFriendShipModel.array(),
			friendOf: RelatedFriendShipModel.array(),
			outcomingFriendInvitation: RelatedFriendInvitationModel.array(),
			incomingFriendInvitation: RelatedFriendInvitationModel.array(),
			outcomingChanInvitation: RelatedChanInvitationModel.array(),
			incomingChanInvitation: RelatedChanInvitationModel.array(),
			blockedUser: RelatedBlockedShipModel.array(),
			blockedByUser: RelatedBlockedShipModel.array(),
			chanDiscussionElement: RelatedChanDiscussionElementModel.array(),
			chanDiscussionEvent: RelatedChanDiscussionEventModel.array(),
			deletedMessageChanDiscussionEvent:
				RelatedDeletedMessageChanDiscussionEventModel.array(),
			mutedChanDiscussionEvent: RelatedMutedUserChanDiscussionEventModel.array(),
			chanDiscussionMessage: RelatedChanDiscussionMessageModel.array(),
			dmDiscussionMesssage: RelatedDmDiscussionMessageModel.array(),
			deletedMessageDmDiscussionEvent: RelatedDeletedMessageDmDiscussionEventModel.array(),
			blockedDmDiscussionEvent_Blocked: RelatedBlockedDmDiscussionEventModel.array(),
			blockedDmDiscussionEvent_Blocking: RelatedBlockedDmDiscussionEventModel.array(),
			timedUserChan: RelatedTimedStatusUserChanModel.array(),
		}),
	)
