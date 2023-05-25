import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class AppService
{
	public chanDiscussionEventsSelect = Prisma.validator<Prisma.ChanDiscussionEventSelect>()
	({
		eventType: true,
		concernedUser: true,
	} satisfies Prisma.ChanDiscussionEventSelect)

	public chanDiscussionMessagesSelect = Prisma.validator<Prisma.ChanDiscussionMessageSelect>()
	({
		content: true,
		relatedTo: true,
	} satisfies Prisma.ChanDiscussionMessageSelect)

	public chanDiscussionElementsSelect = Prisma.validator<Prisma.ChanDiscussionElementSelect>()
	({
		id: true,
		event: { select: this.chanDiscussionEventsSelect },
		message: { select: this.chanDiscussionMessagesSelect },
		author: true,
		creationDate: true
	})
}
