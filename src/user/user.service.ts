import { CreateUserDTO } from './dto/createUser.dto'
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { MessageEvent, NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common'
import { hash } from 'bcrypt'
import { Prisma, User } from '@prisma/client';
import { filterType as blockedFilterType } from './dto/getBlockedList.query.dto';
import { concat, Subject } from 'rxjs';

@Injectable()
export class UserService
{
	constructor(private readonly prisma: PrismaService) { }

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

	async getUserByName(name: string, select: Prisma.UserSelect = { name: true, password: true })
	{
		return this.prisma.user.findUnique({ where: { name: name }, select: select })
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
