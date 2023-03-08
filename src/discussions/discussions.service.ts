import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'
import { CreateDiscussionDTO } from './dto/createDiscussion.dto'
import { UsersService } from '../users/users.service'
import { NotFoundException, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class DiscussionsService
{
	constructor(private usersService: UsersService,
				private readonly prisma: PrismaService) {}
	
	async getAllUsers(id: number)
	{
		return this.prisma.discussion.findUnique({ where: { id: id } }).users()
	}

	async createDiscussion(username: string, createDiscussionDTO: CreateDiscussionDTO)
	{
		if (createDiscussionDTO.users.includes(username))
			throw new UnauthorizedException("you can't add yourself twice to the discussion")

		// check if all users exists
		const users: Promise<any>[] = []
		for (let currUser of createDiscussionDTO.users)
			users.push(this.usersService.getUserByNameOrThrow(currUser))
		await Promise.all(users)
		createDiscussionDTO.users.push(username)

		for (let currDiscussion of await this.usersService.getAllDiscussions(username))
		{
			if (currDiscussion.users.length === createDiscussionDTO.users.length &&
				currDiscussion.users.every((val: any) => createDiscussionDTO.users.includes(val)))
				throw new UnauthorizedException("Discussion already exist !")
		}
		let connect: { id: number }[] = []
		for (let currUser of createDiscussionDTO.users)
			connect.push({ id: (await this.usersService.getUserByName(currUser)).id })
		// need polish tmp dirty test
		let tmp = await this.prisma.discussion.create({ data: { users: { connect: connect } } })
		tmp["users"] = createDiscussionDTO.users
		for (let i of createDiscussionDTO.users)
		{
			if (this.usersService.updateTest[i])
				this.usersService.updateTest[i]["discussions"].push(tmp)
		}
		return tmp
	}

	async removeOneUserFromDiscussion(username: string, discussionID: number)
	{
		this.removeUsersFromDiscussion({ discussionID: discussionID, users: [ username ] })
	}

	async removeUsersFromDiscussion(dto: any)
	{
		let usersID: { id: number }[] = []
		for (let currUser of dto.users)
			usersID.push({ id: (await this.usersService.getUserByName(currUser)).id })
		return this.prisma.discussion.update({ where: { id: dto.discussionID }, data: { users: { disconnect: usersID } } })
	}
}
