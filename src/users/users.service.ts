import { CreateUserDTO } from './dto/createUser.dto'
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'
import { NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common'
import { hash } from 'bcrypt'
import { Prisma, User } from '@prisma/client';
import { filterType as friendFilterType } from './dto/getFriendInvitationList.query.dto';
import { filterType as blockedFilterType } from './dto/getBlockedList.query.dto';

@Injectable()
export class UsersService
{
	constructor(private readonly prisma: PrismaService) { }

	async getFriendList(username: string)
	{
		const res = await this.getUserByNameOrThrow(username,
			{ friendList: true, friendOfList: true })
		// possibilité de faire une distinction pour savoir qui a initié la relation d'ami
		return res.friendList.map(el => el.name).concat(res.friendOfList.map(el => el.name))
	}

	async getFriendInvitationList(username: string, filter: friendFilterType)
	{
		const tmp = await this.getUserByName(username,
			{
				incomingFriendInvitation: filter == friendFilterType['ALL'] || filter == friendFilterType['INCOMING'],
				outcomingFriendInvitation: filter == friendFilterType['ALL'] || filter == friendFilterType['OUTCOMING'],
			})
		switch(filter)
		{
			case (friendFilterType['ALL']):
				return { incoming: tmp.incomingFriendInvitation.map(el => el.name),
					outcoming: tmp.outcomingFriendInvitation.map(el => el.name) }
			case (friendFilterType['INCOMING']):
				return tmp.incomingFriendInvitation.map(el => el.name)
			case (friendFilterType['OUTCOMING']):
				return tmp.outcomingFriendInvitation.map(el => el.name)
		}
	}

	async getBlockedUsers(username: string, filter: blockedFilterType)
	{
		const tmp = await this.getUserByName(username,
			{
				blockedUserList: filter == blockedFilterType['ALL'] || filter == blockedFilterType['BLOCKED'],
				blockedByUserList: filter == blockedFilterType['ALL'] || filter == blockedFilterType['BLOCKEDBY'],
			})
		switch(filter)
		{
			case (blockedFilterType['ALL']):
				return { blocked: tmp.blockedUserList.map(el => el.name),
					blockedBy: tmp.blockedByUserList.map(el => el.name) }
			case (blockedFilterType['BLOCKED']):
				return tmp.blockedUserList.map(el => el.name)
			case (blockedFilterType['BLOCKEDBY']):
				return tmp.blockedByUserList.map(el => el.name)
		}
	}

	async deleteBlocked(myUsername: string, blockedUsername: string)
	{
		let tmp = await this.getUserByName(myUsername, { blockedUserList: true })
		if (!tmp.blockedUserList.some((el: User) => el.name === blockedUsername))
			throw new NotFoundException(`${blockedUsername} is not blocked`)
		await this.prisma.user.update({ where: { name: myUsername },
			data:
			{
				blockedUserList: { disconnect: { name: blockedUsername } }
			}})
	}

	async testUtils(username: string, exceptions: Object, checkFn: Function)
	{
		const includes: Prisma.UserInclude = {}
		Object.keys(exceptions).forEach(k => includes[k] = true)

		const res = await this.getUserByName(username, includes)
		for (const [key, exception] of Object.entries(exceptions))
		{
			if (checkFn(res[key]))
				throw exception
		}
	}

	async createFriendInvitation(invitingUsername: string, invitedUsername: string)
	{
		if (invitingUsername === invitedUsername)
			throw new UnauthorizedException("you can't invite yourself !")
		const exceptions =
		{
			friendList: new ConflictException(`${invitedUsername} is already in your friend list`),
			friendOfList: new ConflictException(`${invitedUsername} is already in your friend list`),
			blockedUserList: new UnauthorizedException(`you blocked ${invitedUsername}`),
			blockedByUserList: new UnauthorizedException(`${invitedUsername} blocked you`),
			outcomingFriendInvitation: new ConflictException(`you already invited ${invitedUsername}`),
			incomingFriendInvitation: new ConflictException(`${invitedUsername} has already invited you`)
		}

		const includes: Prisma.UserInclude = {}
		Object.keys(exceptions).forEach(k => includes[k] = true)

		const checkInvitedUserExistance = this.getUserByNameOrThrow(invitedUsername)
		// const invitationRequirementPromise = this.getUserByName(invitingUsername, includes)
		const invitationRequirementPromise = this.testUtils(invitingUsername, exceptions, (userArray: User[]) => userArray.some((el: User) => el.name === invitedUsername))

		await Promise.all([checkInvitedUserExistance, invitationRequirementPromise])

		// for (const [key, exception] of Object.entries(exceptions))
		// {
		// 	if (invitationRequirement[key].some((el: User) => el.name === invitedUsername))
		// 		throw exception 
		// }

		// sse to send invitation to the invitedUser

		await this.prisma.user.update({ where: { name: invitingUsername },
			data:
			{
				outcomingFriendInvitation: { connect: { name: invitedUsername }}
			}})
	}

	async deleteFriendInvitation(myUsername: string, toDeleteUsername: string)
	{
		let tmp = await this.getUserByName(myUsername,
			{
				outcomingFriendInvitation: true,
				incomingFriendInvitation: true
			})
			if (!tmp.outcomingFriendInvitation.some((el: User) => el.name === toDeleteUsername) &&
				!tmp.incomingFriendInvitation.some((el: User) => el.name === toDeleteUsername))
			{
				throw new NotFoundException(`user ${toDeleteUsername} not found in outcoming or incoming invitation`)
			}

			// sse to send deletion invitation to the toDeleteUser

			await this.prisma.user.update({ where: { name: myUsername },
				data:
				{
					outcomingFriendInvitation: { disconnect: { name: toDeleteUsername } },
					incomingFriendInvitation: { disconnect: { name: toDeleteUsername } },
				}})
	}

	async createFriend(username: string, friendUsername: string)
	{
		let tmp = await this.getUserByName(username, { incomingFriendInvitation: true })
		if (!tmp.incomingFriendInvitation.some((el: User) => el.name === friendUsername))
			throw new UnauthorizedException(`${friendUsername} did not invited you`)
		await this.prisma.user.update({ where: { name: username },
			data:
			{
				friendList: { connect: { name: friendUsername } },
				incomingFriendInvitation: { disconnect: { name: friendUsername } },
			}})
	}

	async deleteFriend(username: string, friendUsername: string)
	{
		let tmp = await this.getUserByName(username, { friendList: true, friendOfList: true })
		if (!tmp.friendList.some((el: User) => el.name === friendUsername) &&
			!tmp.friendOfList.some((el: User) => el.name === friendUsername))
		{
			throw new NotFoundException(`${friendUsername} is not one of your friends`)
		}
		await this.prisma.user.update({ where: { name: username },
			data:
			{
				friendList: { disconnect: { name: friendUsername } },
				friendOfList: { disconnect: { name: friendUsername } },
			}})
	}

	// TODO
	// * unBlockUser
	async blockUser(blockingUsername: string, blockedUsername: string)
	{
		const exceptions =
		{
			blockedUserList: new ConflictException(`you already blocked ${blockedUsername}`)
		}
		const checkInvitedUserExistance = this.getUserByNameOrThrow(blockedUsername)
		// const resPromise = this.getUserByName(blockingUsername, { blockedUserList: true })
		const resPromise = this.testUtils(blockingUsername, exceptions, (userArray: User[]) => userArray.some((el: User) => el.name === blockedUsername))
		await Promise.all([checkInvitedUserExistance, resPromise])
		// if (res.blockedUserList.some((el: User) => el.name == blockedUsername))
		// 	throw new ConflictException(`you already blocked ${blockedUsername}`)
		await this.prisma.user.update({ where: { name: blockingUsername },
			data:
			{
				blockedUserList: { connect: { name: blockedUsername } },
			}})
	}

	async getUserByNameOrThrow(name: string, include?: Prisma.UserInclude)
	{
		const user = await this.getUserByName(name, include)
		if (!user)
			throw new NotFoundException(`user ${name} not found !`)
		return user
	}

	async getUserByName(name: string, include?: Prisma.UserInclude)
	{
		return this.prisma.user.findUnique({ where: { name: name }, include: include })
	}

	async createUser(user: CreateUserDTO)
	{
		if (await this.getUserByName(user.name))
			throw new UnauthorizedException("user already exist")
		user.password = await hash(user.password, 10)
		const { password, ...result } = await this.prisma.user.create({ data: user })
		return result
	}

	updateTest: any[] = []

	getUpdate(username: string)
	{
		let tmp = this.updateTest[username]
		this.updateTest[username] = { discussions: [], messages: [] }
		return { test: tmp }
	}
	
}
