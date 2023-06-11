import { Injectable } from "@nestjs/common"
import { PrismaService } from "nestjs-prisma"
import {
	NotFoundException,
	ConflictException,
} from "@nestjs/common"
import { hash } from "bcrypt"
import { Prisma } from "@prisma/client"
import { NestRequestShapes, nestControllerContract } from "@ts-rest/nest"
import { contract } from "contract"
import { z } from "zod"
import { zUserProfileReturn } from "contract"

const c = nestControllerContract(contract.users)
type RequestShapes = NestRequestShapes<typeof c>

@Injectable()
export class UserService {

	constructor(private readonly prisma: PrismaService) {}

    getUserSelectForUser(username: string) {
        return {
            name: true,
            chans: {
                where: { users: { some: { name: username } } },
                select: { title: true, id: true, type: true }
            },
            dmPolicyLevel: true,
            blockedUser: { where: { blockedUserName: username }, select: { id: true }, take: 1 }
        } satisfies Prisma.UserSelect
    }

    private userSelectGetPayload =
    {
        select: this.getUserSelectForUser("example")
    } satisfies Prisma.UserArgs

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
    
    formatUserForUser(username: string, toFormat: Prisma.UserGetPayload<typeof this.userSelectGetPayload>)
    : z.infer<typeof zUserProfileReturn> {
        const { name, chans, blockedUser,...rest } = toFormat
        return {
            ...rest,
            userName: name,
            commonChans: chans,
            blocked: (blockedUser.length) ? blockedUser[0].id : undefined
        }
    }

    formatUserForUserArray(username: string, toFormat: Prisma.UserGetPayload<typeof this.userSelectGetPayload>[]) {
        return toFormat.map(el => this.formatUserForUser(username, el))
    }

    async searchUsers(username: string, contains: string, nRes: number) {
        const res = await this.prisma.user.findMany({
            where: { name: { contains } },
            take: nRes,
            orderBy: { name: "asc" },
            select: this.getUserSelectForUser(username)
        })
        return this.formatUserForUserArray(username, res)
    }

	async getUserByName(name: string, select: Prisma.UserSelect) {
		return this.prisma.user.findUnique({ where: { name: name }, select: select })
	}

	public async getUserByNameOrThrow<T extends Prisma.UserSelect>(
		username: string,
		select: Prisma.SelectSubset<T, Prisma.UserSelect>,
	) {
		const user = await this.prisma.user.findUnique({
			where: { name: username },
			select: select,
		})
		if (!user) throw new NotFoundException(`not found user ${username}`)
		return user
	}

	async createUser(user: RequestShapes["signUp"]["body"]) {
		if (await this.getUserByName(user.name, { name: true }))
			throw new ConflictException("user already exist")
		user.password = await hash(user.password, 10)
		const { password, ...result } = await this.prisma.user.create({ data: user })
		return result
	}
}
