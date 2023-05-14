import { AbilityBuilder, MongoQuery, PureAbility } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
import { Injectable } from '@nestjs/common';
import { User, DiscussionElement, Chan, Prisma, PermissionList, RoleApplyingType } from '@prisma/client';

export const chanSelect = Prisma.validator<Prisma.ChanArgs>()
({
	select:
	{
		ownerName: true,
		users: { select: { name: true } },
		mutedUsers: { select: { mutedUserName: true } }
	} satisfies Prisma.ChanSelect
})

// export const chanUserSelect = Prisma.validator<Prisma.UserArgs>()
// ({
// 	select:
// 	{
// 		name: true,
// 		roles: { where: { chanId: 999, users: { some: { name: "nino" } } }, select: { permissions: true, roleApplyOn: true, roles: { select: { users: { select: { name: true } } } }, users: { select: { name: true } } } }
// 	} satisfies Prisma.UserSelect
// })
//
// function genChanUserSelect(username: string, chanId: number): {}
// {
// 	return {}
// }

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
	Kick = 'kick'
}

export type ChanUser = { name: string, roles: { users: { name: string }[], permissions: PermissionList[], roleApplyOn: RoleApplyingType, roles: { users: { name: string }[] }[] }[] }

export type AppAbility = PureAbility<
[
	Action | ChanAction,
	Subjects<{ User: User; Message: DiscussionElement, Chan: Prisma.ChanGetPayload<typeof chanSelect>, ChanUser: ChanUser }> | 'all'
]>;

@Injectable()
export class CaslAbilityFactory
{

	createAbilityForUser(user: { name: string })
	{
		const { can, cannot, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

		// can(Action.Read, 'User', [ '*', '!password' ], { name: user.name })
		// can(Action.Read, 'User', [ 'name' ], { name: { not: user.name } })
		// can(Action.Update, 'Message', { author: user.name })
		// can(Action.Delete, 'Message', { author: user.name })
		// can([Action.Delete, Action.Update], 'Message', (a) => ({ chan: { roles: { some: {} } } })
		// {
		// 	OR:
		// 	[
		// 		{ author: user.name },
		// 		{ chan: { roles: { some: {  } } } }
		// 	]
		// /* } */)

		return build();
	}

	createAbilityForUserInChan(user: ChanUser, chan: Prisma.ChanGetPayload<typeof chanSelect>)
	{
		const { can, cannot, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

		if (!chan.users.some(el => el.name === user.name))
		{
			cannot(Action.Manage, 'all').because('You are not in the chan')
			return build()
		}

		if (user.name === chan.ownerName)
			can([ Action.Create, Action.Delete ], 'Message')

		cannot(ChanAction.Leave, 'Chan', { ownerName: user.name }).because("Owner can't leave a chan. He need to either transfer owner ship or delete the chan")
		can(ChanAction.Leave, 'Chan', { ownerName: { not: user.name } })

		can(Action.Read, 'Message')
		if (!chan.mutedUsers.some(el => el.mutedUserName === user.name))
		{
			cannot(Action.Create, 'Message').because('you are muted')
			cannot(Action.Update, 'Message', { author: user.name }).because('you are muted')
		}
		else
		{
			can(Action.Create, 'Message')
			can(Action.Update, 'Message', { author: user.name })
		}
		cannot(Action.Update, 'Message', { author: { not: user.name } }).because("you can't update message than you don't own")
		can(ChanAction.Kick, 'ChanUser', {} })
		
		// can(ChanAction.Kick, '')

		return build()
	}
}
