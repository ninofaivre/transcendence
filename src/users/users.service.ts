import { CreateUserDTO } from './dto/createUser.dto'
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'
import { NotFoundException, UnauthorizedException } from '@nestjs/common'
import { hash } from 'bcrypt'

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) { }

	async getUserByNameOrThrow(name: string)
	{
		const user = await this.getUserByName(name)
		if (!user)
			throw new NotFoundException(`user ${name} not found !`)
		return user
	}

	async getUserByName(name: string)
	{
		return this.prisma.user.findUnique({ where: { name: name } })
	}

	async createUser(user: CreateUserDTO)
	{
		if (await this.getUserByName(user.name))
			throw new UnauthorizedException("user already exist")
		user.password = await hash(user.password, 10)
		return this.prisma.user.create({ data: user })
	}

	async getAllDiscussions(username: string)
	{
		let res: any[] = []
		for (let currDiscussion of (await this.prisma.user.findUnique({ where: { name: username } }).discussions({ include: { users: true }})))
		{
			let userNames: string[] = []
			for (let currUser of currDiscussion.users)
				userNames.push(currUser.name)
			const { users, ...newDiscussion } = currDiscussion
			newDiscussion["users"] = userNames
			res.push(newDiscussion)
		}
		return res
	}

	updateTest: any[] = []

	getUpdate(username: string)
	{
		let tmp = this.updateTest[username]
		this.updateTest[username] = { discussions: [], messages: [] }
		return { test: tmp }
	}
	
}
