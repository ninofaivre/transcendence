import { CreateUserDTO } from './dto/createUser.dto'
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { MessageEvent, NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common'
import { hash } from 'bcrypt'
import { Prisma, User } from '@prisma/client';
import { filterType as blockedFilterType } from './dto/getBlockedList.query.dto';
import { concat, Subject } from 'rxjs';
import { InvitationPathType } from './types/invitationPath.type';

enum EventTypeList
{
	CREATED_INVITATION = "CREATED_INVITATION",
	REFUSED_INVITATION = "REFUSED_INVITATION",
	CANCELED_INVITATION = "CANCELED_INVITATION",
	ACCEPTED_INVITATION = "ACCEPTED_INVITATION",
	DELETED_DM = "DELETED_DM", // n'existera plus à terme (un dm se détruira lorsque les deux users le quitteront)
	DELETED_FRIEND = "DELETED_FRIEND",
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
		invitedUserName: true,
	}

	private friendShipSelect: Prisma.FriendShipSelect =
	{
		id: true,
		creationDate: true,
		requestingUserName: true,
		requestedUserName: true,
		directMessage: { select: { id: true } },
	}

	async getFriends(username: string)
	{
		return this.prisma.friendShip.findMany({
			where:
			{
				OR:
				[
					{ requestedUserName: username },
					{ requestingUserName: username },
				]
			},
			select: this.friendShipSelect })
	}

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
			throw new BadRequestException("self invitation")
		const toCheck = await this.prisma.user.findUnique({
			where:
			{
				name: invitingUsername,
			},
			select:
			{
				friend: { where: { requestedUserName: invitedUsername }, select: { id: true } },
				friendOf: { where: { requestingUserName: invitedUsername }, select: { id: true } },
				blockedUser: { where: { blockedUserName: invitedUsername }, select: { id: true } },
				blockedByUser: { where: { blockingUserName: invitedUsername }, select: { id: true } },
				incomingFriendInvitation: { where: { invitingUserName: invitedUsername }, select: { id: true } },
			}})
		if (toCheck.friend.length || toCheck.friendOf.length)
			throw new ForbiddenException(`you are already friend with ${invitedUsername}`)
		if (toCheck.blockedUser.length)
			throw new ForbiddenException(`you blocked ${invitedUsername}`)
		if (toCheck.blockedByUser.length)
			throw new ForbiddenException(`you have been blocked by ${invitedUsername}`)
		if (toCheck.incomingFriendInvitation.length)
			throw new ForbiddenException(`${invitedUsername} already invited you`)
		try
		{
			const res = await this.prisma.friendInvitation.create({
				data:
				{
					invitingUserName: invitingUsername,
					invitedUserName: invitedUsername
				},
				select: this.friendInvitationSelect })
			await this.pushEvent(invitedUsername, { type: EventTypeList.CREATED_INVITATION, data: res })
			return res
		}
		catch (e)
		{
			throw new ConflictException(`invitation for user ${invitedUsername} already exist`)
		}
	}

	async deleteFriendInvitation(username: string, type: InvitationPathType, id: number)
	{
		try
		{
			const res = await this.prisma.friendInvitation.delete({
				where:
				{
					id: id,
					invitedUserName: type === 'INCOMING' && username || undefined,
					invitingUserName: type === 'OUTCOMING' && username || undefined,
				},
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
			throw new NotFoundException(`invitation with id ${id} not found`)
		}
	}

	async acceptInvitation(username: string, id: number)
	{
		try
		{
			const { invitingUserName } = await this.prisma.friendInvitation.delete({
				where:
				{
					invitedUserName: username,
					id: id
				},
				select: { invitingUserName: true }})
			const newFriendShip = await this.prisma.friendShip.create({
				data:
				{
					requestingUser: { connect: { name: invitingUserName } },
					requestedUser: { connect: { name: username } }
				},
				select: this.friendShipSelect })
			await this.pushEvent(invitingUserName,
				{
					type: EventTypeList.ACCEPTED_INVITATION,
					data: { deletedFriendInvitationId: id, friend: newFriendShip }
				})
		}
		catch (e)
		{
			console.log(e)
			if (e.code === 'P2025')
				throw new ForbiddenException(`invitation with id ${id} not found`)
			if (e.code === 'P2002')
				throw new ConflictException(`friendship already exist`) // should never happen
		}
	}

	async deleteFriend(username: string, id: number)
	{
		try
		{
			const { requestedUserName, requestingUserName, directMessage } = await this.prisma.friendShip.delete({
				where: { id: id },
				select:
				{
					requestedUserName: true,
					requestingUserName: true,
					directMessage: { select: { id: true } }
				}})
			const eventUserName = (username === requestedUserName) && requestingUserName || requestedUserName
			const eva = this.pushEvent(eventUserName,
				{
					type: EventTypeList.DELETED_FRIEND,
					data: { deletedFriendId: id }
				})
			const evb = this.pushEvent(eventUserName,
				{
					type: EventTypeList.DELETED_DM,
					data: { deletedDmId: directMessage.id }
				})
			await Promise.all([eva, evb])
		}
		catch
		{
			throw new NotFoundException(`friendship with id ${id} not found`)
		}
	}

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
