import { CreateUserDTO } from './dto/createUser.dto'
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'
import { NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common'
import { hash } from 'bcrypt'
import { Prisma, User } from '@prisma/client';
import { filterType as filterType } from './dto/getFriendInvitationList.dto';

@Injectable()
export class UsersService
{
	constructor(private readonly prisma: PrismaService) { }

	async getFriendList(username: string)
	{
		const test = await this.getUserByNameOrThrow(username, { friendList: true })
		return test.friendList
	}

	async getFriendInvitationList(username: string, filter: filterType)
	{
		const tmp = await this.getUserByName(username,
			{
				incomingFriendInvitation: filter == filterType['ALL'] || filter == filterType['INCOMING'],
				outcomingFriendInvitation: filter == filterType['ALL'] || filter == filterType['OUTCOMING'],
			})
		switch(filter)
		{
			case (filterType['ALL']):
				return { incoming: tmp.incomingFriendInvitation.map(el => el.name),
					outcoming: tmp.outcomingFriendInvitation.map(el => el.name) }
			case (filterType['INCOMING']):
				return tmp.incomingFriendInvitation.map(el => el.name)
			case (filterType['OUTCOMING']):
				return tmp.outcomingFriendInvitation.map(el => el.name)
		}
	}

	async createFriendInvitation(invitingUsername: string, invitedUsername: string)
	{
		let checkInvitedUserExistance = this.getUserByNameOrThrow(invitedUsername)
		let invitationRequirementPromise = this.getUserByName(invitingUsername,
			{
				outcomingFriendInvitation: true,
				incomingFriendInvitation: true,
				blockedUserList: true,
				blockedByUserList: true,
				friendList: true,
				friendOfList: true,
			})

		let invitationRequirement = (await Promise.all([checkInvitedUserExistance, invitationRequirementPromise]))[1]

		let exceptions =
		{
			friendList: new ConflictException(`${invitedUsername} is already in your friend list`),
			friendOfList: new ConflictException(`${invitedUsername} is already in your friend list`),
			blockedUserList: new UnauthorizedException(`you blocked ${invitedUsername}`),
			blockedByUserList: new UnauthorizedException(`${invitedUsername} blocked you`),
			outcomingFriendInvitation: new ConflictException(`you already invited ${invitedUsername}`),
			incomingFriendInvitation: new ConflictException(`${invitedUsername} has already invited you`)
		}

		for (const [key, exception] of Object.entries(exceptions))
		{
			if (invitationRequirement[key].some((el: User) => el.name === invitedUsername))
				throw exception 
		}

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
