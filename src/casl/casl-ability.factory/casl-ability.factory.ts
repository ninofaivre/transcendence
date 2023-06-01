import { AbilityBuilder, ForbiddenError, PureAbility, subject } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
import { ForbiddenException, Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { User, ChanDiscussionElement, Chan, Prisma, PermissionList, RoleApplyingType, FriendInvitation, FriendInvitationStatus, ChanInvitation, ChanInvitationStatus } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { ChansService } from '../../chans/chans.service'
import { UserService } from 'src/user/user.service';

const chanSelect = Prisma.validator<Prisma.ChanArgs>()
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

const chanUserSelect = Prisma.validator<Prisma.UserArgs>()
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

const userSelect = Prisma.validator<Prisma.UserArgs>()
({
	select:
	{
		name: true,
		friend: { select: { requestedUserName: true } },
		friendOf: { select: { requestingUserName: true } },
		blockedUser: { select: { blockedUserName: true } },
		blockedByUser: { select: { blockingUserName: true } },
		outcomingFriendInvitation: { where: { status: FriendInvitationStatus.PENDING }, select: { invitedUserName: true } },
		incomingFriendInvitation: { where: { status: FriendInvitationStatus.PENDING }, select: { invitingUserName: true } },
		outcomingChanInvitation: { where: { status: ChanInvitationStatus.PENDING }, select: { invitedUserName: true } },
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

export enum InvitationAction
{
	Accept = 'accept',
	Cancel = 'cancel',
	Refuse = 'refuse'
}

type ChanUser = Prisma.UserGetPayload<typeof chanUserSelect>
type UserSubject = Prisma.UserGetPayload<typeof userSelect>

type ChanSubjects = Subjects<{ Message: ChanDiscussionElement, Chan: Prisma.ChanGetPayload<typeof chanSelect>, ChanUser: ChanUser, ChanInvitation: ChanInvitation }> | 'all'

type ChanAppAbility = PureAbility<
[
	Action | ChanAction,
	ChanSubjects
], PrismaQuery>;

type subjects = Subjects<{ User: UserSubject, FriendInvitation: FriendInvitation, ChanInvitation: ChanInvitation }>

type AppAbility = PureAbility<
[
	Action | InvitationAction,
	subjects
], PrismaQuery>

@Injectable()
export class CaslAbilityFactory
{

	constructor(private readonly prisma: PrismaService,
				@Inject(forwardRef(() => ChansService))
				private readonly chansService: ChansService,
				@Inject(forwardRef(() => UserService))
			    private readonly userService: UserService) {}

	private async getChan(chanId: string, username: string)
	{
		return this.prisma.chan.findUnique({ where: { id: chanId, users: { some: { name: username } } }, ...chanSelect })
	}

	private async getChanUser(chanId: string, username: string)
	{
		return this.userService.getUserByNameOrThrow(username ,
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
			})
	}

	private async getUser(username: string)
	{
		return this.userService.getUserByNameOrThrow(username, userSelect.select)
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
						{ rolesSym: { some: { permissions: { has: perm }, users: { some: { name: username } } } } },
						{ users: { some: { name: username } }, permissions: { has: perm }, roleApplyOn: RoleApplyingType.ROLES_AND_SELF }
					]
				}
			}
		}
	}

	private doesChanUserHasPerm(user: ChanUser, perm: PermissionList): boolean
	{
		return (user.roles.some(el => el.permissions.some(p => p === perm)))
	}

	// TODO: change any type for subject
	async checkAbilitiesForUser(username: string, rules: { action: Action, subject: any }[])
	{
		const ability = await this.createAbilityForUser(await this.getUser(username))

		try
		{
			rules.forEach(rule =>
			{
				ForbiddenError.from(ability).throwUnlessCan(rule.action, rule.subject)
			})
		}
		catch (error)
		{
			if (error instanceof ForbiddenError)
				throw new ForbiddenException(error.message) // maybe throw not found in prod
		}
	}

	private async createAbilityForUser(user: UserSubject)
	{
		const friends = Array.prototype.concat(user.friend.map(el => el.requestedUserName), user.friendOf.map(el => el.requestingUserName))
		const blockedUsers = user.blockedUser.map(el => el.blockedUserName)
		const blockedByUsers = user.blockedByUser.map(el => el.blockingUserName)
		const pendingOutcomingFriendInvitations = user.outcomingFriendInvitation.map(el => el.invitedUserName)
		const pendingIncomingFriendInvitations = user.incomingFriendInvitation.map(el => el.invitingUserName)
		const pendingOutcomingChanInvitations = user.outcomingChanInvitation.map(el => el.invitedUserName)

		const { can, cannot, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

		/* FRIEND_INVITATION */
		can(Action.Create, 'FriendInvitation')
		cannot(Action.Create, 'FriendInvitation', { invitedUserName: { in: pendingIncomingFriendInvitations } }).because("already invited by user")
		cannot(Action.Create, 'FriendInvitation', { invitedUserName: { in: pendingOutcomingFriendInvitations } }).because("already invited user")
		cannot(Action.Create, 'FriendInvitation', { invitedUserName: { in: friends } }).because("already friend with user")
		cannot(Action.Create, 'FriendInvitation', { invitedUserName: user.name }).because("self invitation")
		cannot(Action.Create, 'FriendInvitation', { invitedUserName: { in: blockedUsers } }).because("blocked user")
		cannot(Action.Create, 'FriendInvitation', { invitedUserName: { in: blockedByUsers } }).because("blocked by user")

		can(Action.Update, 'FriendInvitation', { status: FriendInvitationStatus.PENDING })
		cannot(Action.Update, 'FriendInvitation', { status: { not: FriendInvitationStatus.PENDING } }).because("not a PENDING invitation")
		/* FRIEND_INVITATION */

		/* CHAN_INVITATION */
		can(Action.Create, 'ChanInvitation')
		cannot(Action.Create, 'ChanInvitation', { invitedUserName: { notIn: friends } }).because("not friend user")
		cannot(Action.Create, 'ChanInvitation', { invitedUserName: { in: pendingOutcomingChanInvitations } }).because("already invited user")

		can(Action.Update, 'ChanInvitation', { status: ChanInvitationStatus.PENDING })
		cannot(Action.Update, 'ChanInvitation', { status: { not: ChanInvitationStatus.PENDING } }).because("not a PENDING invitation")
		/* CHAN_INVITATION */

		return build()
	}

	// TODO: change any type for subject
	async checkAbilitiesForUserInChan(username: string, chanId: string, rules: { action: Action | ChanAction, subject: any }[])
	{
		const user = await this.getChanUser(chanId, username)
		const chan = await this.getChan(chanId, username)
		if (!chan)
			throw new NotFoundException(`not found chan ${chanId}`)

		const ability = await this.createAbilityForUserInChan(user, chan)

		try
		{
			rules.forEach(rule =>
			{
				ForbiddenError.from(ability).throwUnlessCan(rule.action, rule.subject)
			})
		}
		catch (error)
		{
			if (error instanceof ForbiddenError)
				throw new ForbiddenException(error.message)
		}
	}


	private async createAbilityForUserInChan(user: ChanUser, chan: Prisma.ChanGetPayload<typeof chanSelect>)
	{

		const chanUsers = chan.users.map(el => el.name)

		const { can, cannot, build } = new AbilityBuilder<ChanAppAbility>(createPrismaAbility);

		/* ALL */

		can(Action.Read, 'Message')

		/* ALL */

		cannot(ChanAction.Leave, 'Chan', { ownerName: user.name }).because("Owner can't leave a chan. He need to either transfer owner ship or delete the chan")
		can(ChanAction.Leave, 'Chan', { ownerName: { not: user.name } })

		if (this.doesChanUserHasPerm(user, PermissionList.SEND_MESSAGE))
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

		if (this.doesChanUserHasPerm(user, PermissionList.DESTROY))
			can(Action.Delete, 'Chan')

		/* CHAN_INVITATION */
		can(Action.Create, 'ChanInvitation')
		if (!this.doesChanUserHasPerm(user, PermissionList.INVITE) && chan.ownerName !== user.name)
			cannot(Action.Create, 'ChanInvitation').because("user doesn't has INVITE permissions in chan")
		// cannot(Action.Create, 'ChanInvitation', { invitedUserName: { in: bannedUsers } }).because("banned user")
		cannot(Action.Create, 'ChanInvitation', { invitedUserName: { in: chanUsers } }).because("already in chan user")
		/* CHAN_INVITATION */


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
