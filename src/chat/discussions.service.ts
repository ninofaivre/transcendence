import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'
import { UserService } from '../user/user.service'
import { NotFoundException, UnauthorizedException } from '@nestjs/common'
import { ChatService } from './chat.service';

@Injectable()
export class DiscussionsService
{
	constructor(private userService: UserService,
				private readonly chatService: ChatService,
				private readonly prisma: PrismaService) {}
	
	/*
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

		for (let currDiscussion of await this.chatService.getAllDiscussions(username))
		{
			if (currDiscussion.users.length === createDiscussionDTO.users.length &&
				currDiscussion.users.every((val: any) => createDiscussionDTO.users.includes(val)))
				throw new UnauthorizedException("Discussion already exist !")
		}
		let connect: { name: string }[] = []
		for (let currUser of createDiscussionDTO.users)
			connect.push({ name: currUser })
		// need polish tmp dirty test
		let tmp = await this.prisma.discussion.create({ data: { title: createDiscussionDTO.title, users: { connect: connect } } })
		tmp["users"] = createDiscussionDTO.users
		for (let i of createDiscussionDTO.users)
			this.chatService.pushEvent(i, { data: tmp, type: "createdDiscussion" })
		return tmp
	}

	async removeOneUserFromDiscussion(username: string, discussionID: number)
	{
		this.removeUsersFromDiscussion({ discussionID: discussionID, users: [ username ] })
	}

	async removeUsersFromDiscussion(dto: any)
	{
		let disconnect: { name: string}[] = []
		for (let currUser of dto.users)
			disconnect.push({ name: currUser })
		return this.prisma.discussion.update({ where: { id: dto.discussionID }, data: { users: { disconnect: disconnect } } })
	}
	*/
}
