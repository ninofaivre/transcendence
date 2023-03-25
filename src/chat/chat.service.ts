import { BadRequestException, ConflictException, ForbiddenException, Injectable, MessageEvent, NotFoundException, NotImplementedException, UnauthorizedException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { hash } from 'bcrypt';
import { ChanType, PermissionList, RoleApplyingType } from '@prisma/client'
import { Subject } from 'rxjs';
import { PrismaService } from 'src/prisma.service';
import { Username } from 'src/user/decorator/username.decorator';
import { CreateDiscussionDTO, CreatePrivateChanDTO, CreatePublicChanDTO } from './dto/createDiscussion.dto';
import { discussionEnumType } from './dto/getDiscussions.query.dto';

@Injectable()
export class ChatService
{
	constructor(private readonly prisma: PrismaService) { }

	private eventSource = new Map<String, Subject<MessageEvent>>()

	private defaultPermissions: PermissionList[] =
	[
		'INVITE',
		'SEND_MESSAGE',
	]

	private adminPermissions: PermissionList[] =
	[
		'KICK',
		'BAN',
		'MUTE'
	]

	private usersSelect: Prisma.UserSelect = { name: true, }

	private rolesSelect: Prisma.RoleSelect =
	{
		permissions: true,
		roleApplyOn: true,
		roles: { select: { name: true } },
		name: true,
		users: { select: this.usersSelect },
	}

	private chanSelect: Prisma.ChanSelect =
	{
		discussionId: true,
		title: true,
		type: true,
		owner: { select: this.usersSelect },
		users: { select: this.usersSelect },
		roles: { select: this.rolesSelect },
	}

	private directMessageSelect: Prisma.DirectMessageSelect =
	{
		discussionId: true,
		users: { select: this.usersSelect },
	}

	addSubject(username: string) {
		this.eventSource.set(username, new Subject<MessageEvent>)
	}

	async pushEvent(username: string, event: MessageEvent) {
		this.eventSource.get(username)?.next(event)
	}

	sendObservable(username: string) {
		return this.eventSource.get(username).asObservable()
	}

	deleteSubject(username: string) {
		console.log("close /users/sse for", username)
		this.eventSource.delete(username)
	}

	async getChanWhereInputWithUsersByDiscussionId(discussionId: number, usernames: string[]): Promise<Prisma.ChanWhereUniqueInput>
	{
		const res: Prisma.ChanWhereUniqueInput =
		{
			discussionId: discussionId,
			AND: usernames.map(el => { return { users: { some: { name: el } } } }) 
		}
		return res
	}

	async getChanWhereInputIfRightOverSelf(discussionId: number, username: string, perm: PermissionList)
	{
		const res: Prisma.ChanWhereUniqueInput =
		{
			... await this.getChanWhereInputWithUsersByDiscussionId(discussionId, [username]),
			OR:
			[
				{ ownerName: username },
				{
					roles:
					{
						some:
						{
							permissions: { has: perm },
							users: { some: { name: username } },
						}
					}
				},
			]
		}
		return res
	}

	async getChanWhereInputIfRightOverOther(discussionId: number, username: string, otherUsername: string, perm: PermissionList)
	{
		const res: Prisma.ChanWhereUniqueInput =
		{
			... await this.getChanWhereInputWithUsersByDiscussionId(discussionId, [username, otherUsername]),
			OR:
			[
				{ ownerName: username },
				{
					roles:
					{
						some:
						{
							permissions: { has: perm },
							roleApplyOn: { not: RoleApplyingType.NONE },
							users: { some: { name: username } },
							OR:
							[
								{ users: { none: { name: otherUsername } } },
								{ roleApplyOn: RoleApplyingType.ROLES_AND_SELF },
							],
							roles: { some: { users: { some: { name: otherUsername } } } },
						}
					},
				},
			]
		}
		return res
	}

	async getDiscussions(username: string, discussionFilter: discussionEnumType)
	{
		const select: Prisma.UserSelect =
		{
			chans: (discussionFilter === 'ALL' || discussionFilter === 'CHAN') && { select: this.chanSelect },
			directMessage: (discussionFilter === 'ALL' || discussionFilter === 'DM') && { select: this.directMessageSelect }
		}
		const res = await this.prisma.user.findUnique({ where: { name: username }, select: select })
		if (discussionFilter === 'DM')
			return res.directMessage
		if (discussionFilter === 'CHAN')
			return res.chans
		return { dm: res.directMessage, chan: res.chans }
	}

	async getDiscussionById(username: string, id: number)
	{
		const res = await this.prisma.user.findUnique({ where: { name: username },
			select:
			{
				directMessage:
				{
					where: { discussionId: id },
					select: this.directMessageSelect
				},
				chans:
				{
					where: { discussionId: id },
					select: this.chanSelect
				}}})
		return res.directMessage.length && { type: 'DM', discussion: res.directMessage[0] }
			|| res.chans.length && { type: 'CHAN', discussion: res.chans[0] }
	}

	async addUserToDiscussion(username: string, id: number, friendUsername: string)
	{
		const res = await this.prisma.user.findUnique({ where: { name: username },
			select:
			{
				friendList: { where: { name: friendUsername }, select: { name: true } },
				friendOfList: { where: { name: friendUsername }, select: { name: true } },
				chans: { where: { discussionId: id }, select: { users: { select: { name: true } } } },
			}})
		if (!res.chans.length)
			throw new BadRequestException(`the discussion with id ${id} does not exist or you are not in`)
		if (!res.friendList.length && !res.friendOfList.length)
			throw new BadRequestException(`your are not friend with ${friendUsername}`)
		if (res.chans[0].users.some(el => el.name === friendUsername))
			throw new ConflictException(`${friendUsername} is already in chan`)
		await this.prisma.chan.update({
			where: await this.getChanWhereInputIfRightOverSelf(id, username, PermissionList.INVITE),
			data:
			{
				users: { connect: { name: friendUsername } }
			}})
	}

	async removeUserFromDiscussionById(removingUsername: string, removedUsername: string, id: number)
	{
		try
		{
			await this.prisma.chan.update({
				where: await this.getChanWhereInputIfRightOverOther(id, removingUsername, removedUsername, PermissionList.KICK),
				data:
				{
					users: { disconnect: { name: removedUsername } }
				}})
		}
		catch
		{
			throw new ForbiddenException('right exception')
		}
	}

	async createChan(username: string, dto: CreateDiscussionDTO)
	{
		if (dto.publicChan?.password)
			dto.publicChan.password = await hash(dto.publicChan.password, 10)
		try
		{
			const res = (await this.prisma.discussion.create({
				data:
				{
					chan:
					{
						create:
						{
							type: dto.privateChan && ChanType.PRIVATE || ChanType.PUBLIC,
							title: dto.privateChan?.title || dto.publicChan?.title,
							password: dto.publicChan?.password,
							owner: { connect: { name: username } },
							users: { connect: { name: username } },
							roles:
							{
								create:
								[
									
									{
										name: 'DEFAULT',
										permissions: this.defaultPermissions,
										roleApplyOn: RoleApplyingType.NONE
									},
									{
										name: 'ADMIN',
										permissions: this.adminPermissions,
										roleApplyOn: RoleApplyingType.ROLES,
									},
								]
							},
						}
					}
				},
				select:
				{
					chan: { select: { ...this.chanSelect, id: true} }
				}})).chan
			await this.prisma.role.update({ where: { chanId_name: { chanId: res.id, name: 'ADMIN'} },
				data:
				{
					roles: { connect: { chanId_name: { chanId: res.id, name: 'DEFAULT' } } }
				}})
			delete res.id
			return res
		}
		catch
		{
			// support multiple private chan with same title later
			throw new ConflictException(`title ${dto.privateChan?.title || dto.publicChan?.title} already taken`)
		}
	}

	async deleteDiscussion(username: string, discussionId: number)
	{
		try
		{
			await this.prisma.chan.delete({ where: await this.getChanWhereInputIfRightOverSelf(discussionId, username, PermissionList.DESTROY) })
		}
		catch (e)
		{
			console.error(e)
			throw new ForbiddenException('no right to do this')
		}
	}

	async createDm(myUsername: string, friendUsername: string)
	{
		const res = await this.prisma.user.findUnique({ where: { name: myUsername },
			select:
			{
				friendList:
				{
					where: { name: friendUsername },
					select: { name: true },
					take: 1,
				},
				friendOfList:
				{
					where: { name: friendUsername },
					select: { name: true },
					take: 1,
				},
				directMessage:
				{
					where: { users: { some: { name:friendUsername } } },
					select: { discussionId: true },
					take: 1,
				},
			}})
		if (res.directMessage.length)
			throw new ConflictException(`you already have a direct message with ${friendUsername} (discussion id : ${res.directMessage[0].discussionId})`)
		if (!res.friendList.length && !res.friendOfList.length)
			throw new ForbiddenException(`${friendUsername} is not in your friendList !`)
		return (await this.prisma.discussion.create({
			data:
			{
				directMessage:
				{
					create:
					{
						users: { connect: [{name: myUsername}, {name: friendUsername}] },
					}
				}
			},
			select:
			{
				directMessage: { select: this.directMessageSelect },
			}})).directMessage
	}
}
