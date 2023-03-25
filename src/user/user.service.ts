import { CreateUserDTO } from './dto/createUser.dto'
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'
import { MessageEvent, NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common'
import { hash } from 'bcrypt'
import { Prisma, User } from '@prisma/client';
import { filterType as blockedFilterType } from './dto/getBlockedList.query.dto';
import { Subject } from 'rxjs';
import { InvitationPathType } from './types/invitationPath.type';

enum EventTypeList
{
	CREATED_INVITATION = "CREATED_INVITATION",
	REFUSED_INVITATION = "REFUSED_INVITATION",
	CANCELED_INVITATION = "CANCELED_INVITATION",
}

@Injectable()
export class UserService
{
	constructor(private readonly prisma: PrismaService) { }

	private eventSource = new Map<String, Subject<MessageEvent>>()

	addSubject(username: string)
	{
		this.eventSource.set(username, new Subject<MessageEvent>)
	}

	async pushEvent(username: string, event: MessageEvent)
	{
		this.eventSource.get(username)?.next(event)
	}

	sendObservable(username: string)
	{
		return this.eventSource.get(username).asObservable()
	}

	deleteSubject(username: string)
	{
		console.log("close /users/sse for", username)
		this.eventSource.delete(username)
	}

	private friendInvitationSelect: Prisma.FriendInvitationSelect =
	{
		id: true,
		creationDate: true,
		invitingUserName: true,
		invitedUserName: true
	}
	// async getFriendList(username: string)
	// {
	// 	const res = await this.getUserByName(username,
	// 		{ friendList: true, friendOfList: true })
	// 	// possibilité de faire une distinction pour savoir qui a initié la relation d'ami
	// 	return res.friendList.map(el => el.name).concat(res.friendOfList.map(el => el.name))
	// }

	async getFriendInvitations(username: string, filter?: InvitationPathType)
	{
		const res = await this.prisma.user.findUnique({ where: { name: username },
			select:
			{
				incomingFriendInvitation: (!filter || filter == 'INCOMING') && { select: this.friendInvitationSelect },
				outcomingFriendInvitation: (!filter || filter == 'OUTCOMING') && { select: this.friendInvitationSelect },
			}})
		if (!filter)
			return { incoming: res.incomingFriendInvitation, outcoming: res.outcomingFriendInvitation }
		return res.incomingFriendInvitation || res.outcomingFriendInvitation
	}

	// async getBlockedUsers(username: string, filter: blockedFilterType)
	// {
	// 	const tmp = await this.getUserByName(username,
	// 		{
	// 			blockedUserList: filter == blockedFilterType['ALL'] || filter == blockedFilterType['BLOCKED'],
	// 			blockedByUserList: filter == blockedFilterType['ALL'] || filter == blockedFilterType['BLOCKEDBY'],
	// 		})
	// 	switch(filter)
	// 	{
	// 		case (blockedFilterType['ALL']):
	// 			return { blocked: tmp.blockedUserList.map(el => el.name),
	// 				blockedBy: tmp.blockedByUserList.map(el => el.name) }
	// 		case (blockedFilterType['BLOCKED']):
	// 			return tmp.blockedUserList.map(el => el.name)
	// 		case (blockedFilterType['BLOCKEDBY']):
	// 			return tmp.blockedByUserList.map(el => el.name)
	// 	}
	// }
	//
	// async testUtils(username: string, exceptions: Object, checkFn: Function)
	// {
	// 	const includes: Prisma.UserInclude = {}
	// 	Object.keys(exceptions).forEach(k => includes[k] = true)
	//
	// 	const res = await this.getUserByName(username, includes)
	// 	for (const [key, exception] of Object.entries(exceptions))
	// 	{
	// 		if (checkFn(res[key]))
	// 			throw exception
	// 	}
	// }
	//
	// async deleteBlocked(myUsername: string, blockedUsername: string)
	// {
	// 	await this.testUtils(myUsername,
	// 		{ blockedUserList: new NotFoundException(`${blockedUsername} is not in blockedUserList`) },
	// 		(usersArray: User[]) => !usersArray.some((el: User) => el.name === blockedUsername))
	// 	const updatePromise = this.prisma.user.update({ where: { name: myUsername },
	// 		data:
	// 		{
	// 			blockedUserList: { disconnect: { name: blockedUsername } }
	// 		}})
	// 	const addEventPromise = this.pushEvent(blockedUsername, { data: { user: myUsername }, type: "deletedBlocked" })
	// 	await Promise.all([updatePromise, addEventPromise])
	// }

	async createFriendInvitation(invitingUsername: string, invitedUsername: string)
	{
		if (invitingUsername === invitedUsername)
			throw new BadRequestException("you can't invite yourself !")
		try
		{
			const res = (await this.prisma.user.update({
				where:
				{
					name: invitingUsername,
					friendList: { none: { name: invitedUsername } },
					friendOfList: { none: { name: invitedUsername } },
					blockedUserList: { none: { name: invitedUsername } },
					blockedByUserList: { none: { name: invitedUsername } },
					outcomingFriendInvitation: { none: { invitedUserName: invitedUsername } },
					incomingFriendInvitation: { none: { invitingUserName: invitedUsername } }
				},
				data:
				{
					outcomingFriendInvitation: { create: { invitedUserName: invitedUsername } }
				},
				select:
				{
					outcomingFriendInvitation:
					{
						where: { invitedUserName: invitedUsername },
						select: this.friendInvitationSelect
					}
				}
			})).outcomingFriendInvitation[0]
			await this.pushEvent(invitedUsername, { type: EventTypeList.CREATED_INVITATION, data: res })
			return res
		}
		catch
		{
			throw new ForbiddenException("can't create this friend invitation")
		}
	}

	async deleteFriendInvitation(type: InvitationPathType, id: number)
	{
		try
		{
			const res = await this.prisma.friendInvitation.delete({
				where: { id: id },
				select:
				{
					invitedUserName: type === 'OUTCOMING',
					invitingUserName: type === 'INCOMING',
				}})
			await this.pushEvent(res.invitedUserName || res.invitingUserName,
				{
					type: type === 'INCOMING' && EventTypeList.REFUSED_INVITATION || EventTypeList.CANCELED_INVITATION,
					data: { friendInvitationId: id }
				})
		}
		catch
		{
			throw new NotFoundException('invitation not found')
		}
	}

	// async createFriend(username: string, friendUsername: string)
	// {
	// 	await this.testUtils(username,
	// 		{ incomingFriendInvitation: new ForbiddenException(`${friendUsername} did not invited you`) },
	// 		(usersArray: User[]) => !usersArray.some((el: User) => el.name === friendUsername))
	// 	const updatePromise = this.prisma.user.update({ where: { name: username },
	// 		data:
	// 		{
	// 			friendList: { connect: { name: friendUsername } },
	// 			incomingFriendInvitation: { disconnect: { name: friendUsername } },
	// 		}})
	// 	const addEventPromise = this.pushEvent(friendUsername, { data: { user: username }, type: "createdFriend" })
	// 	await Promise.all([updatePromise, addEventPromise])
	// }
	//
	// async deleteFriend(username: string, friendUsername: string)
	// {
	// 	let tmp = await this.getUserByName(username, { friendList: true, friendOfList: true })
	// 	if (!tmp.friendList.some((el: User) => el.name === friendUsername) &&
	// 		!tmp.friendOfList.some((el: User) => el.name === friendUsername))
	// 	{
	// 		throw new NotFoundException(`${friendUsername} is not one of your friends`)
	// 	}
	// 	const updatePromise = this.prisma.user.update({ where: { name: username },
	// 		data:
	// 		{
	// 			friendList: { disconnect: { name: friendUsername } },
	// 			friendOfList: { disconnect: { name: friendUsername } },
	// 		}})
	// 	const addEventPromise = this.pushEvent(friendUsername, { data: { user: username }, type: "deletedFriend" })
	// 	await Promise.all([updatePromise, addEventPromise]) 
	// }
	//
	// async blockUser(blockingUsername: string, blockedUsername: string)
	// {
	// 	const checkBlockedUserExistance = this.getUserByNameOrThrow(blockedUsername)
	// 	const checkBlockingUserRequirements = this.testUtils(blockingUsername,
	// 		{ blockedUserList: new ConflictException(`you already blocked ${blockedUsername}`) },
	// 		(userArray: User[]) => userArray.some((el: User) => el.name === blockedUsername))
	//
	// 	await Promise.all([checkBlockedUserExistance, checkBlockingUserRequirements])
	// 	const updatePromise = this.prisma.user.update({ where: { name: blockingUsername },
	// 		data:
	// 		{
	// 			blockedUserList: { connect: { name: blockedUsername } },
	// 		}})
	// 	const addEventPromise = this.pushEvent(blockedUsername, { data: { user: blockingUsername }, type: "createdBlocked" })
	// 	await Promise.all([updatePromise, addEventPromise])
	// }

	async getUserByNameOrThrow(name: string, exception: "notFound" | "badRequest" = "notFound", include?: Prisma.UserInclude)
	{
		const user = await this.getUserByName(name, include)
		const exceptionMessage = `user ${user} not found !`
		if (!user)
		{
			switch(exception)
			{
				case ("notFound"):
					throw new NotFoundException(exceptionMessage)
				case ("badRequest"):
					throw new BadRequestException(exceptionMessage)
			}
		}
		return user
	}

	async getUserByName(name: string, include?: Prisma.UserInclude)
	{
		return this.prisma.user.findUnique({ where: { name: name }, include: include })
	}

	async createUser(user: CreateUserDTO)
	{
		if (await this.getUserByName(user.name))
			throw new ConflictException("user already exist")
		user.password = await hash(user.password, 10)
		const { password, ...result } = await this.prisma.user.create({ data: user })
		return result
	}
}
