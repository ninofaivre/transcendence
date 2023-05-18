import { AbilityBuilder, ForbiddenError, PureAbility, subject } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
import { ForbiddenException, Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { User, DiscussionElement, Chan, Prisma, PermissionList, RoleApplyingType } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { ChansService } from '../../chans/chans.service'

export const chanSelect = Prisma.validator<Prisma.ChanArgs>()
({
	select:
	{
		ownerName: true,
		users: { select: { name: true } },
		mutedUsers:
		{
			select:
			{
				mutedUserName: true,
				untilDate: true,
				id: true
			}
		}
	} satisfies Prisma.ChanSelect
})

export const chanUserSelect = Prisma.validator<Prisma.UserArgs>()
({
	select:
	{
		name: true,
		roles:
		{
			select:
			{
				roleApplyOn: true,
				permissions: true,
				users: { select: { name: true } },
				rolesSym:
				{
					select:
					{
						users: { select: { name: true } },
						permissions: true
					}
				}
			}
		}
	} satisfies Prisma.UserSelect
})

export enum Action
{
	Manage = 'manage',
	Create = 'create',
	Read = 'read',
	Update = 'update',
	Delete = 'delete',
}

export enum ChanAction
{
	Leave = 'leave',
	Kick = 'kick',
	Mute = 'mute',
}

type ChanUser = Prisma.UserGetPayload<typeof chanUserSelect>

export type subjects = Subjects<{ User: User; Message: DiscussionElement, Chan: Prisma.ChanGetPayload<typeof chanSelect>, ChanUser: ChanUser }> | 'all'

export type AppAbility = PureAbility<
[
	Action | ChanAction,
	subjects
], PrismaQuery>;

@Injectable()
export class CaslAbilityFactory
{

	constructor(private readonly prisma: PrismaService,
				@Inject(forwardRef(() => ChansService))
				private chansService: ChansService) {}

	public async getChan(chanId: number)
	{
		const chan = await this.prisma.chan.findUnique({ where: { id: chanId }, ...chanSelect })
		if (!chan)
			throw new NotFoundException(`chan with id ${chanId} not found`)
		return chan
	}

	public async getUser(chanId: number, username: string)
	{
		const user = await this.prisma.user.findUnique({ where: { name: username, chans: { some: { id: chanId } } },
			select:
			{
				name: true,
				roles:
				{
					where: { chanId: chanId },
					select:
					{
						permissions: true,
						roleApplyOn: true,
						users: { select: { name: true } },
						rolesSym:
						{
							where:
							{
								users: { none: { name: username } },
								roleApplyOn: RoleApplyingType.ROLES,
							},
							select: { users: { select: { name: true } }, permissions: true }
						}
					}
				}
			}})
		if (!user)
			throw new ForbiddenException(`user with name ${username} not in chan with id ${chanId}`)
		return user
	}

	private getActionOverUserCondition(username: string, perm: PermissionList)
	{
		return {
			roles:
			{
				some:
				{
					OR:
					[
						{ rolesSym: { some: { permissions: { has: PermissionList.KICK }, users: { some: { name: username } } } } },
						{ users: { some: { name: username } }, permissions: { has: perm }, roleApplyOn: RoleApplyingType.ROLES_AND_SELF }
					]
				}
			}
		}
	}

	private doesUserHasPerm(user: ChanUser, perm: PermissionList): boolean
	{
		return (user.roles.some(el => el.permissions.some(p => p === perm)))
	}

	async createAbilityForUserInChan(user: ChanUser, chan: Prisma.ChanGetPayload<typeof chanSelect>)
	{
		const { can, cannot, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

		/* ALL */

		can(Action.Read, 'Message')

		/* ALL */

		cannot(ChanAction.Leave, 'Chan', { ownerName: user.name }).because("Owner can't leave a chan. He need to either transfer owner ship or delete the chan")
		can(ChanAction.Leave, 'Chan', { ownerName: { not: user.name } })

		if (this.doesUserHasPerm(user, PermissionList.SEND_MESSAGE))
			can(Action.Create, 'Message')
		can(Action.Update, 'Message', { author: user.name })
		cannot(Action.Update, 'Message', { author: { not: user.name } }).because("you can't update other's message")
		// TODO: Test than removeMutedIfUntilDateReached server reboot guards works
		if (chan.mutedUsers.some(el => el.mutedUserName === user.name) && !(await this.chansService.removeMutedIfUntilDateReached(chan.mutedUsers.find(el => el.mutedUserName === user.name))))
		{
			cannot(Action.Create, 'Message').because('you are muted')
			cannot(Action.Update, 'Message', { author: user.name }).because('you are muted')
		}
		cannot(Action.Update, 'Message', { author: { not: user.name } }).because("you can't update message than you don't own")

		can(ChanAction.Kick, 'ChanUser', this.getActionOverUserCondition(user.name, PermissionList.KICK))
		cannot(ChanAction.Kick, 'ChanUser', { name: user.name }).because("you can't kick yourself")
		cannot(ChanAction.Kick, 'ChanUser', { name: chan.ownerName }).because("you can't kick the owner of the chan")

		can(ChanAction.Mute, 'ChanUser', this.getActionOverUserCondition(user.name, PermissionList.MUTE))
		cannot(ChanAction.Mute, 'ChanUser', { name: user.name }).because("you can't kick yourself")
		cannot(ChanAction.Mute, 'ChanUser', { name: chan.ownerName }).because("you can't kick the owner of the chan")

		if (this.doesUserHasPerm(user, PermissionList.DESTROY))
			can(Action.Delete, 'Chan')

		/* OWNER */

		if (user.name === chan.ownerName)
		{
			can([ Action.Create, Action.Delete ], 'Message')
			can([ ChanAction.Kick, ChanAction.Mute ], 'ChanUser')
			can([ Action.Delete ], 'Chan')
		}

		/* OWNER */


		return build()
	}
}
