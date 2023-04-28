import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class AppService
{
	public discussionEventsSelect = Prisma.validator<Prisma.DiscussionEventSelect>()
	({
		eventType: true,
		concernedUser: true,
		ChanInvitation: { select: { id: true } },
		chanInvitationRelatedTitle: true
	})

	public discussionMessagesSelect = Prisma.validator<Prisma.DiscussionMessageSelect>()
	({
		content: true,
		relatedTo: true,
	})

	public discussionElementsSelect = Prisma.validator<Prisma.DiscussionElementSelect>()
	({
		id: true,
		event: { select: this.discussionEventsSelect },
		message: { select: this.discussionMessagesSelect },
		author: true,
		creationDate: true
	})

	public directMessageSelect = Prisma.validator<Prisma.DirectMessageSelect>()
	({
		id: true,
		friendShipId: true,

		requestedUserName: true,
		requestedUserStatus: true,
		requestedUserStatusMutedUntil: true,

		requestingUserName: true,
		requestingUserStatus: true,
		requestingUserStatusMutedUntil: true
	})
}
