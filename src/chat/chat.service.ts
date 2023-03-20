import { ConflictException, ForbiddenException, Injectable, MessageEvent, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
//import { DiscussionType, Discussion } from '@prisma/client'
import { Subject } from 'rxjs';
import { PrismaService } from 'src/prisma.service';
import { CreateChanDTO } from './dto/createChan.dto';
import { discussionType } from './dto/createDiscussionType.path.dto';
import { chanEnumType } from './dto/getChans.path.dto';
import { discussionEnumType } from './dto/getDiscussions.path.dto';

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

	// async getDiscussionById(username: string, type: filterType, id: number)
	// {
	// 	const res = await this.prisma.user.findUnique({ where: { name: username },
	// 		select:
	// 		{
	// 			directMessage: (filterType['ALL'] === type || filterType['DM'] === type) && { where: { discussionId: id }, select: this.directMessageSelect },
	// 			chan: (filterType['ALL'] === type || filterType['CHAN'] === type) && { where: { discussionId: id }, select: this.chanSelect }
	// 		}})
	// 	if (!res.directMessage?.length && !res.chan?.length)
	// 		throw new NotFoundException(`discussion not found : ${id}`)
	// 	if (res.directMessage?.length)
	// 	{
	// 		if (filterType['ALL'] === type)
	// 			return { dm: res.directMessage[0] } 
	// 		return res.directMessage[0]
	// 	}
	// 	if (res.chan?.length)
	// 	{
	// 		if (filterType['ALL'] === type)
	// 			return { chan: res.chan[0] }
	// 		return res.chan[0]
	// 	}
	// }

	async getDiscussions(username: string, type: discussionEnumType)
	{
		const select: Prisma.UserSelect =
		{
			publicChan: (type === discussionEnumType['ALL'] || type === discussionEnumType['CHAN']) && { select: this.publicChanSelect },
			privateChan: (type === discussionEnumType['ALL'] || type === discussionEnumType['CHAN']) && { select: this.privateChanSelect },
			directMessage: (type === discussionEnumType['ALL'] || type === discussionEnumType['DM']) && { select: this.directMessageSelect }
		}
		const res = await this.prisma.user.findUnique({ where: { name: username }, select: select })
		if (type === discussionEnumType['DM'])
			return res.directMessage
		if (type === discussionEnumType['CHAN'])
			return { private: res.privateChan, public: res.publicChan }
		return { dm: res.directMessage, chan: { private: res.privateChan, public: res.publicChan } }
	}

	async getChans(username: string, type: chanEnumType)
	{
		const select: Prisma.UserSelect =
		{
			publicChan: (type === chanEnumType['PUBLIC']) && { select: this.publicChanSelect },
			privateChan: (type === chanEnumType['PRIVATE']) && { select: this.privateChanSelect }
		}
		const res = await this.prisma.user.findUnique({ where: { name: username }, select: select })
		if (type === chanEnumType['PRIVATE'])
			return res.privateChan
		if (type === chanEnumType['PUBLIC'])
			return res.publicChan
	}

	// async createChan(myUsername: string, dto: CreateChanDTO)
	// {
	// 	// try to put this in class-validtor later
	// 	if (!dto.title && dto.type === ChanType['PUBLIC_CHAN'])
	// 		throw new ForbiddenException('PUBLIC_CHAN need title to be find')
	// 	if (dto.password && dto.type === ChanType['PRIVATE_CHAN'])
	// 		throw new ForbiddenException('PRIVATE_CHAN with password makes no sense')
	// 	// try to put this in class-validtor later
	// }
	//
	// async createDm(myUsername: string, friendUsername: string)
	// {
	// 	const test: Prisma.UserListRelationFilter = {} 
	// 	test.some = {name: friendUsername}
	// 	const res = await this.prisma.user.findUnique({ where: { name: myUsername },
	// 		select:
	// 		{
	// 			friendList:
	// 			{
	// 				where: { name: friendUsername },
	// 				select: { name: true },
	// 				take: 1,
	// 			},
	// 			friendOfList:
	// 			{
	// 				where: { name: friendUsername },
	// 				select: { name: true },
	// 				take: 1,
	// 			},
	// 			directMessage:
	// 			{
	// 				where: { users: { some: { name:friendUsername } } },
	// 				select: { discussionId: true },
	// 				take: 1,
	// 			},
	// 		}})
	// 	if (res.directMessage.length)
	// 		throw new ConflictException(`you already have a direct message with ${friendUsername} (discussion id : ${res.directMessage[0].discussionId})`)
	// 	if (!res.friendList.length && !res.friendOfList.length)
	// 		throw new ForbiddenException(`${friendUsername} is not in your friendList !`)
	// 	return (await this.prisma.discussion.create({
	// 		data:
	// 		{
	// 			directMessage:
	// 			{
	// 				create:
	// 				{
	// 					users: { connect: [{name: myUsername}, {name: friendUsername}] },
	// 				}
	// 			}
	// 		},
	// 		select:
	// 		{
	// 			directMessage: { select: { ...this.directMessageSelect } },
	// 		}})).directMessage
	// }
}
