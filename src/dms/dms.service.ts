import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { AppService } from 'src/app.service';

enum EventTypeList
{
	NEW_DM = 'NEW_DM',
	DM_DELETED = "DM_DELETED",
	DM_NEW_EVENT = "DM_NEW_EVENT",
}

@Injectable()
export class DmsService
{
	constructor(private readonly prisma: PrismaService,
			    private readonly appService: AppService) {}


	private directMessageSelect: Prisma.DirectMessageSelect =
	{
		id: true,
		requestedUserName: true,
		requestingUserName: true,
	}

	private discussionEventsSelect: Prisma.DiscussionEventSelect =
	{
		eventType: true,
		concernedUser: true,
	}

	private discussionMessagesSelect: Prisma.DiscussionMessageSelect =
	{
		content: true,
		relatedId: true,
	}

	private discussionElementsSelect: Prisma.DiscussionElementSelect =
	{
		id: true,
		event: { select: this.discussionEventsSelect },
		message: { select: this.discussionMessagesSelect },
		author: true,
		creationDate: true
	}


	async DmNewEvent(username: string, usernameToNotify: string, dmId: number, event: string) // event will change later from string to prisma schema enum type when it will work again
	{
		const { discussionElement: res } = await this.prisma.discussionEvent.create({
			data:
			{
				eventType: event,
				discussionElement:
				{
					create:
					{
						author: username,
						directMessageId: dmId,
					}
				}
			},
			select:
			{
				discussionElement: { select: this.discussionElementsSelect }
			}})
		return this.appService.pushEvent(usernameToNotify,
			{
				type: EventTypeList.DM_NEW_EVENT,
				data: { directMessageId: dmId, event: res }
			})
	}

	async getDms(username: string)
	{
		return this.prisma.directMessage.findMany({
			where:
			{
				OR:
				[
					{ requestedUserName: username },
					{ requestingUserName: username }
				]
			},
			select: this.directMessageSelect})
	}

	async createDm(username: string, friendUsername: string)
	{
		const toCheck = await this.prisma.user.findUnique({ where: { name: username },
			select:
			{
				friend:
				{
					where:
					{
						requestedUserName: friendUsername,
					},
					select: { id: true, directMessage: { select: { id: true } } },
					take: 1,
				},
				friendOf:
				{
					where:
					{
						requestingUserName: friendUsername,
					},
					select: { id: true, directMessage: { select: { id: true } } },
					take: 1,
				}
			}})
		if (!toCheck.friend.length && !toCheck.friendOf.length)
			throw new ForbiddenException(`${friendUsername} is not in your friendList !`)
		if (toCheck.friend[0]?.directMessage || toCheck.friendOf[0]?.directMessage)
			throw new ConflictException(`you already have a dm with ${friendUsername}`)
		const res = await this.prisma.directMessage.create({
			data:
			{
				friendShipId: toCheck.friend[0].id || toCheck.friend[0].id,
				requestingUserName: username,
				requestedUserName: friendUsername
			},
			select: this.directMessageSelect})
		await this.appService.pushEvent(friendUsername, { type: EventTypeList.NEW_DM, data: res })
		return res
	}

	async deleteDm(username: string, id: number)
	{
		try
		{
			const { requestedUserName, requestingUserName} = await this.prisma.directMessage.delete({
				where:
				{
					id: id,
					OR:
					[
						{ requestedUserName: username },
						{ requestingUserName: username },
					],
				},
				select:
				{
					requestingUserName: true,
					requestedUserName: true,
				}})
			await this.appService.pushEvent((requestedUserName !== username) && requestedUserName || requestingUserName,
				{
					type: EventTypeList.DM_DELETED,
					data: { directMessageId: id }
				})
		}
		catch
		{
			throw new NotFoundException(`DM with id ${id} not found`)
		}
	}

	async leaveDm(username: string, id: number)
	{
		const toCheck = await this.prisma.directMessage.findUnique({
			where:
			{
				id: id,
				OR:
				[
					{ requestingUserName: username },
					{ requestedUserName: username },
				]
			},
			select:
			{
				requestingUserName: true,
				requestedUserName: true,
			}})
		if (!toCheck)
			throw new NotFoundException(`DM with id ${id} not found`)
		const { requestingUserName, requestedUserName } = await this.prisma.directMessage.update({
			where: { id: id },
			data:
			{
				requestingUserName: (toCheck.requestingUserName === username) ? null : undefined,
				requestedUserName:  (toCheck.requestedUserName === username) ? null : undefined,
			},
			select:
			{
				requestedUserName: true,
				requestingUserName: true,
			}})
		await this.DmNewEvent(username, requestedUserName || requestingUserName, id, 'AUTHOR_LEAVED')
	}

	async joinDm(username: string, id: number)
	{
		const toCheck = await this.prisma.directMessage.findUnique({
			where:
			{
				id: id,
				OR:
				[
					{ friendShip: { requestedUserName: username } },
					{ friendShip: { requestingUserName: username } },
				]
			},
			select:
			{
				requestingUserName: true,
				requestedUserName: true,
			}})
		if (!toCheck)
			throw new NotFoundException(`DM with id ${id} not found`)
		if (toCheck.requestedUserName === username || toCheck.requestingUserName === username)
			throw new ConflictException(`you are already part of dm with id ${id}`)
		const { requestedUserName, requestingUserName } = await this.prisma.directMessage.update({
			where:
			{
				id: id,
				OR:
				[
					{ friendShip: { requestedUserName: username } },
					{ friendShip: { requestingUserName: username } },
				],
			},
			data:
			{
				requestedUserName: (!toCheck.requestedUserName) ? username : undefined,
				requestingUserName: (!toCheck.requestingUserName) ? username: undefined,
			},
			select:
			{
				requestedUserName: true,
				requestingUserName: true,
			}})
		console.log("join:", requestedUserName, requestingUserName)
		await this.DmNewEvent(username, requestedUserName || requestingUserName, id, 'AUTHOR_JOINED')
	}

	async getDmMessages(username: string, id: number, nMessages: number, start?: number)
	{
		const res = await this.prisma.directMessage.findUnique({
			where:
			{
				id: id,
				OR:
				[
					{ requestingUserName: username },
					{ requestedUserName: username },
				],
			},
			select:
			{
				elements:
				{
					select: this.discussionElementsSelect,
					take: nMessages,
					orderBy: { id: 'desc' },
					cursor: (!!start) ? { id: start } : undefined,
					skip: Number(!!start),
				}
			}})
		if (!res)
			throw new NotFoundException(`directMessage with id ${id} not found`)
		return res.elements.reverse()
	}

	async createDmMessage(username: string, dmId: number, content: string, relatedId?: number)
	{
		const toCheck = await this.prisma.directMessage.findUnique({
			where:
			{
				id: dmId,
				OR:
				[
					{ requestedUserName: username },
					{ requestingUserName: username },
				],
			},
			select: (relatedId !== undefined) ?
			{
				elements:
				{
					where: { id: relatedId },
					select: { id: true },
					take: 1
				}
			} : undefined})
		if (!toCheck)
			throw new NotFoundException(`directMessage with id ${dmId} not found`)
		if (relatedId !== undefined && !toCheck.elements?.length)
			throw new NotFoundException(`element with id ${relatedId} not found in directMessage with id ${dmId}`)
		return (await this.prisma.discussionMessage.create({
			data:
			{
				content: content,
				related: (relatedId !== undefined) ?
				{
					connect:
					{
						id: relatedId
					}
				}: undefined,
				discussionElement:
				{
					create:
					{
						author: username,
						directMessageId: dmId
					}
				}
			},
			select:
			{
				discussionElement: { select: this.discussionElementsSelect }
			}})).discussionElement
	}
}
