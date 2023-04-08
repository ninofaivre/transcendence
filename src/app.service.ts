import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class AppService
{
	public discussionEventsSelect = Prisma.validator<Prisma.DiscussionEventSelect>()
	({
		eventType: true,
		concernedUser: true,
	})

	public discussionMessagesSelect = Prisma.validator<Prisma.DiscussionMessageSelect>()
	({
		content: true,
		relatedId: true,
	})

	public discussionElementsSelect = Prisma.validator<Prisma.DiscussionElementSelect>()
	({
		id: true,
		event: { select: this.discussionEventsSelect },
		message: { select: this.discussionMessagesSelect },
		author: true,
		creationDate: true
	})
}
