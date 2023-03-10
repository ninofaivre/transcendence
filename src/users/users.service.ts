import { CreateUserDTO } from './dto/createUser.dto'
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'
import { NotFoundException, UnauthorizedException } from '@nestjs/common'
import { hash } from 'bcrypt'

@Injectable()
export class UsersService
{
	constructor(private readonly prisma: PrismaService) { }

	async getFriendList(username: string)
	{
		const test = await this.getUserByNameOrThrow(username, { friendList: true })
		return test['friendList']
	}

	async createFriendInvitation(invitingUsername: string, invitedUsername: string)
	{
		let checkInviting = this.getUserByNameOrThrow(invitingUsername, { outcomingFriendInvitation: true })
			.then(res =>
				{
					if (res['outcomingFriendInvitation'].some(el => el.name === invitedUsername))
						throw new UnauthorizedException(`${invitingUsername} can't invite twice ${invitedUsername}`)
				})
		let checkInvited = this.getUserByNameOrThrow(invitedUsername, { incomingFriendInvitation: true })
			.then(res =>
				{
					if (res['incomingFriendInvitation'].some(el => el.name === invitingUsername))
						throw new UnauthorizedException(`${invitedUsername} can't be invited twice by ${invitingUsername}`) // should never throw
				})
		await Promise.all([ checkInviting, checkInvited ])


		let updateInviting = this.prisma.user.update({ where: { name: invitingUsername },
								data:
								{
									outcomingFriendInvitation: { connect: { name: invitedUsername }}
								}})
		let updateInvited = this.prisma.user.update({ where: { name: invitedUsername },
								data:
								{
									incomingFriendInvitation: { connect: { name: invitingUsername }}
								}})
		await Promise.all([ updateInviting, updateInvited ])
	}

	async getUserByNameOrThrow(name: string, include?: Object)
	{
		const user = await this.getUserByName(name, include)
		if (!user)
			throw new NotFoundException(`user ${name} not found !`)
		return user
	}

	async getUserByName(name: string, include?: Object)
	{
		if (include)
			return this.prisma.user.findUnique({ where: { name: name }, include: include })
		else
			return this.prisma.user.findUnique({ where: { name: name } })
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
