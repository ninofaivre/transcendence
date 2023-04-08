import { BadRequestException, ConflictException, ForbiddenException, Injectable, MessageEvent, NotFoundException, NotImplementedException, UnauthorizedException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { hash } from 'bcrypt';
import { ChanType, PermissionList, RoleApplyingType } from '@prisma/client'
import { Subject } from 'rxjs';
import { PrismaService } from 'nestjs-prisma';
import { Username } from 'src/user/decorator/username.decorator';
import { CreateDiscussionDTO, CreatePrivateChanDTO, CreatePublicChanDTO } from './dto/createDiscussion.dto';
import { discussionEnumType } from './dto/getDiscussions.query.dto';

@Injectable()
export class ChatService {
	constructor(private readonly prisma: PrismaService) { }

	// async getChanWhereInputWithUsersByDiscussionId(discussionId: number, usernames: string[]): Promise<Prisma.ChanWhereUniqueInput>
	// {
	// 	const res: Prisma.ChanWhereUniqueInput =
	// 	{
	// 		discussionId: discussionId,
	// 		AND: usernames.map(el => { return { users: { some: { name: el } } } }) 
	// 	}
	// 	return res
	// }
	//
	// async getChanWhereInputIfRightOverSelf(discussionId: number, username: string, perm: PermissionList)
	// {
	// 	const res: Prisma.ChanWhereUniqueInput =
	// 	{
	// 		... await this.getChanWhereInputWithUsersByDiscussionId(discussionId, [username]),
	// 		OR:
	// 		[
	// 			{ ownerName: username },
	// 			{
	// 				roles:
	// 				{
	// 					some:
	// 					{
	// 						permissions: { has: perm },
	// 						users: { some: { name: username } },
	// 					}
	// 				}
	// 			},
	// 		]
	// 	}
	// 	return res
	// }
	//
	// async getChanWhereInputIfRightOverOther(discussionId: number, username: string, otherUsername: string, perm: PermissionList)
	// {
	// 	const res: Prisma.ChanWhereUniqueInput =
	// 	{
	// 		... await this.getChanWhereInputWithUsersByDiscussionId(discussionId, [username, otherUsername]),
	// 		OR:
	// 		[
	// 			{ ownerName: username },
	// 			{
	// 				roles:
	// 				{
	// 					some:
	// 					{
	// 						permissions: { has: perm },
	// 						roleApplyOn: { not: RoleApplyingType.NONE },
	// 						users: { some: { name: username } },
	// 						OR:
	// 						[
	// 							{ users: { none: { name: otherUsername } } },
	// 							{ roleApplyOn: RoleApplyingType.ROLES_AND_SELF },
	// 						],
	// 						roles: { some: { users: { some: { name: otherUsername } } } },
	// 					}
	// 				},
	// 			},
	// 		]
	// 	}
	// 	return res
	// }
	// async getDiscussionById(username: string, id: number)
	// {
	// 	const res = await this.prisma.user.findUnique({ where: { name: username },
	// 		select:
	// 		{
	// 			directMessage:
	// 			{
	// 				where: { discussionId: id },
	// 				select: this.directMessageSelect
	// 			},
	// 			chans:
	// 			{
	// 				where: { discussionId: id },
	// 				select: this.chanSelect
	// 			}}})
	// 	return res.directMessage.length && { type: 'DM', discussion: res.directMessage[0] }
	// 		|| res.chans.length && { type: 'CHAN', discussion: res.chans[0] }
	// }
	//
	// async addUserToDiscussion(username: string, id: number, friendUsername: string)
	// {
	// 	const res = await this.prisma.user.findUnique({ where: { name: username },
	// 		select:
	// 		{
	// 			friendList: { where: { name: friendUsername }, select: { name: true } },
	// 			friendOfList: { where: { name: friendUsername }, select: { name: true } },
	// 			chans: { where: { discussionId: id }, select: { users: { select: { name: true } } } },
	// 		}})
	// 	if (!res.chans.length)
	// 		throw new BadRequestException(`the discussion with id ${id} does not exist or you are not in`)
	// 	if (!res.friendList.length && !res.friendOfList.length)
	// 		throw new BadRequestException(`your are not friend with ${friendUsername}`)
	// 	if (res.chans[0].users.some(el => el.name === friendUsername))
	// 		throw new ConflictException(`${friendUsername} is already in chan`)
	// 	await this.prisma.chan.update({
	// 		where: await this.getChanWhereInputIfRightOverSelf(id, username, PermissionList.INVITE),
	// 		data:
	// 		{
	// 			users: { connect: { name: friendUsername } }
	// 		}})
	// }
	//
	// async removeUserFromDiscussionById(removingUsername: string, removedUsername: string, id: number)
	// {
	// 	try
	// 	{
	// 		await this.prisma.chan.update({
	// 			where: await this.getChanWhereInputIfRightOverOther(id, removingUsername, removedUsername, PermissionList.KICK),
	// 			data:
	// 			{
	// 				users: { disconnect: { name: removedUsername } }
	// 			}})
	// 	}
	// 	catch
	// 	{
	// 		throw new ForbiddenException('right exception')
	// 	}
	// }
	//
	}
