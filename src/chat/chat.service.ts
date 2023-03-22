import { BadRequestException, ConflictException, ForbiddenException, Injectable, MessageEvent, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { hash } from 'bcrypt';
//import { DiscussionType, Discussion } from '@prisma/client'
import { Subject } from 'rxjs';
import { PrismaService } from 'src/prisma.service';
import { Username } from 'src/users/decorator/username.decorator';
import { CreateChanDTO } from './dto/createChan.dto';
import { CreatePublicChanDTO } from './dto/createDiscussion.dto';
import { chanEnumType, discussionEnumType } from './dto/getDiscussions.query.dto';

@Injectable()
export class ChatService
{
	constructor(private readonly prisma: PrismaService) { }

	private eventSource = new Map<String, Subject<MessageEvent>>()

	private usersSelect: Prisma.UserSelect = { name: true, }

	private publicChanSelect: Prisma.PublicChanSelect =
	{
		discussionId: true,
		title: true,
		users: { select: this.usersSelect },
	}

	private privateChanSelect: Prisma.PrivateChanSelect = { ...this.publicChanSelect }

	private directMessageSelect: Prisma.DirectMessageSelect =
	{
		discussionId: true,
		users: { select: this.usersSelect },
	}

	addSubject(username: string) {
		this.eventSource.set(username, new Subject<MessageEvent>)
	}

	async pushEvent(username: string, event: MessageEvent) {
		this.eventSource.get(username)?.next(event)
	}

	sendObservable(username: string) {
		return this.eventSource.get(username).asObservable()
	}

	deleteSubject(username: string) {
		console.log("close /users/sse for", username)
		this.eventSource.delete(username)
	}

	async getDiscussions(username: string, discussionFilter: discussionEnumType, chanFilter: chanEnumType)
	{
		const select: Prisma.UserSelect =
		{
			publicChan: ((discussionFilter === 'ALL' || discussionFilter === 'CHAN') && (chanFilter === 'ALL' || chanFilter === 'PUBLIC')) && { select: this.publicChanSelect },
			privateChan: ((discussionFilter === 'ALL' || discussionFilter === 'CHAN') && (chanFilter === 'ALL' || chanFilter === 'PRIVATE')) && { select: this.privateChanSelect },
			directMessage: (discussionFilter === 'ALL' || discussionFilter === 'DM') && { select: this.directMessageSelect }
		}
		const res = await this.prisma.user.findUnique({ where: { name: username }, select: select })
		if (discussionFilter === 'DM')
			return res.directMessage
		if (discussionFilter === 'CHAN')
		{
			if (chanFilter !== 'ALL')
				return res.publicChan || res.privateChan
			return { public: res.publicChan, private: res.privateChan }
		}
		return { dm: res.directMessage, chan: { private: res.privateChan, public: res.publicChan } }
	}

	async getDiscussionById(username: string, id: number)
	{
		const res = await this.prisma.user.findUnique({ where: { name: username },
			select:
			{
				directMessage:
				{
					where: { discussionId: id },
					select: this.directMessageSelect
				},
				privateChan:
				{
					where: { discussionId: id },
					select: this.privateChanSelect
				},
				publicChan:
				{
					where: { discussionId: id },
					select: this.publicChanSelect
				}
			}})
		return res.directMessage.length && { type: 'DM', discussion: res.directMessage[0] }
			|| res.privateChan.length && { type: 'PRIVATE_CHAN', discussion: res.privateChan[0] }
			|| res.publicChan.length && { type: 'PUBLIC_CHAN', discussion: res.publicChan[0] }
	}

	async addUserToDiscussion(username: string, id: number, friendUsername: string)
	{
		const res = await this.prisma.user.findUnique({ where: { name: username },
			select:
			{
				friendList: { where: { name: friendUsername } },
				friendOfList: { where: { name: friendUsername } },
				privateChan: { where: { discussionId: id }, select: { discussionId: true } },
				publicChan: { where: { discussionId: id }, select: { discussionId: true } },
			}})
		if (!res.privateChan.length && !res.publicChan.length)
			throw new BadRequestException(`the discussion with id ${id} does not exist or you are not in`)
		if (!res.friendList.length && !res.friendOfList.length)
			throw new BadRequestException(`your are not friend with ${friendUsername}`)
		if (res.publicChan.length)
		{
			return this.prisma.publicChan.update({ where: { discussionId: id },
				data:
				{
					users: { connect: { name: friendUsername } }
				}})
		}
		if (res.privateChan.length)
		{
			return this.prisma.privateChan.update({ where: { discussionId: id },
				data:
				{
					users: { connect: { name: friendUsername } }
				}})
		}
	}

	async removeUserFromDiscussionById(removingUsername: string, removedUsername: string, id: number)
	{
		const tryUpdatingPrivateChanPromise = this.prisma.privateChan.update({
			where:
			{
				discussionId: id,
				AND:
				[
					{ users: { some: { name: removingUsername } } },
					{ users: { some: { name: removedUsername } } },
				]
			},
			data:
			{
				users: { disconnect: { name: removedUsername } }
			}})
		const tryUpdatingPublicChanPromise = this.prisma.publicChan.update({
			where:
			{
				discussionId: id,
				AND:
				[
					{ users: { some: { name: removingUsername } } },
					{ users: { some: { name: removedUsername } } },
				]
			},
			data:
			{
				users: { disconnect: { name: removedUsername } }
			}})
		try
		{
			await Promise.any([tryUpdatingPrivateChanPromise, tryUpdatingPublicChanPromise]) 
			return "success"
		}
		catch
		{
			return "failure"
		}
	}

	async createPublicChan(username: string, dto: CreatePublicChanDTO)
	{
		if (dto.password)
			dto.password = await hash(dto.password, 10)
		try
		{
		return (await this.prisma.discussion.create({
			data:
			{
				publicChan:
				{
					create:
					{
						title: dto.title,
						password: dto.password,
						users: { connect: { name: username } }
					}
				}
			},
			select:
			{
				publicChan: { select: this.publicChanSelect },
			}})).publicChan
		}
		catch
		{
			throw new ConflictException(`a public chan with the title "${dto.title}" already exists`)
		}
	}

	async createPrivateChan(username: string, title?: string)
	{
		return (await this.prisma.discussion.create({
			data:
			{
				privateChan:
				{
					create:
					{
						title: title,
						users: { connect: { name: username } }
					}
				}
			},
			select:
			{
				privateChan: { select: this.privateChanSelect },
			}})).privateChan
	}

	async createDm(myUsername: string, friendUsername: string)
	{
		const res = await this.prisma.user.findUnique({ where: { name: myUsername },
			select:
			{
				friendList:
				{
					where: { name: friendUsername },
					select: { name: true },
					take: 1,
				},
				friendOfList:
				{
					where: { name: friendUsername },
					select: { name: true },
					take: 1,
				},
				directMessage:
				{
					where: { users: { some: { name:friendUsername } } },
					select: { discussionId: true },
					take: 1,
				},
			}})
		if (res.directMessage.length)
			throw new ConflictException(`you already have a direct message with ${friendUsername} (discussion id : ${res.directMessage[0].discussionId})`)
		if (!res.friendList.length && !res.friendOfList.length)
			throw new ForbiddenException(`${friendUsername} is not in your friendList !`)
		return (await this.prisma.discussion.create({
			data:
			{
				directMessage:
				{
					create:
					{
						users: { connect: [{name: myUsername}, {name: friendUsername}] },
					}
				}
			},
			select:
			{
				directMessage: { select: this.directMessageSelect },
			}})).directMessage
	}
}
