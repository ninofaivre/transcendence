import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PermissionList, Prisma, RoleApplyingType } from '@prisma/client';
import { hash } from 'bcrypt';
import { PrismaService } from 'nestjs-prisma';
import { CreateChanTest } from './dto/createChan.dto';
import { AppService } from 'src/app.service';

enum EventTypeList
{
	CHAN_DELETED = "CHAN_DELETED",
	CHAN_NEW_EVENT = "CHAN_NEW_EVENT"
}

@Injectable()
export class ChansService
{

	constructor(private readonly prisma: PrismaService,
			    private readonly appService: AppService) {}


	private usersSelect: Prisma.UserSelect =
	{
		name: true,
	}

	private rolesSelect: Prisma.RoleSelect =
	{
		permissions: true,
		roleApplyOn: true,
		roles: { select: { name: true } },
		name: true,
		users: { select: this.usersSelect },
	}

	private chansSelect: Prisma.ChanSelect =
	{
		id: true,
		title: true,
		type: true,
		ownerName: true,
		users: { select: this.usersSelect },
		roles: { select: this.rolesSelect },
	}

	private discussionEventsSelect: Prisma.DiscussionEventSelect =
	{
		eventType: true,
		concernedUser: true,
	}

	private discussionElementsSelect: Prisma.DiscussionElementSelect =
	{
		id: true,
		event: { select: this.discussionEventsSelect },
		author: true,
		creationDate: true
	}

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


	async getUserChans(username: string) // /me
	{
		// TODO: test later if find user then select chan is faster
		return this.prisma.chan.findMany({
			where:
			{
				users: { some: { name: username } }
			},
			select: this.chansSelect})
	}

	async createChan(username: string, chan: CreateChanTest)
	{
		if (chan.password)
			chan.password = await hash(chan.password, 10)
		try
		{
			const res = await this.prisma.chan.create({
				data:
				{
					type: chan.type,
					title: chan.title,
					password: chan.password,
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
				},
				select: this.chansSelect})
			await this.prisma.role.update({ where: { chanId_name: { chanId: res.id, name: 'ADMIN'} },
				data:
				{
					roles: { connect: { chanId_name: { chanId: res.id, name: 'DEFAULT' } } }
				}})
			return res
		}
		catch
		{
			throw new ConflictException(`conflict, a chan with the  title ${chan.title} already exist`)
		}
	}

	async deleteChan(username: string, id: number)
	{
		const toCheck = await this.prisma.chan.findUnique({
			where:
			{
				id: id,
				users: { some: { name: username } }
			},
			select:
			{
				roles:
				{
					where:
					{
						permissions: { has: PermissionList.DESTROY },
						users: { some: { name: username } }
					},
					take: 1,
				},
				ownerName: true
			}})
		if (!toCheck)
			throw new NotFoundException("chan not found")
		if (!toCheck.roles.length && toCheck.ownerName !== username)
			throw new ForbiddenException("you don't have right to destroy this chan")
		const toNotify = (await this.prisma.chan.delete({
			where: { id: id },
			select:
			{
				users: { select: this.usersSelect }
			}})).users
		toNotify.forEach(el => this.appService.pushEvent(el.name, { type: EventTypeList.CHAN_DELETED, data: { chanId: id } }))
	}

	async leaveChan(username: string, id: number)
	{
		const toCheck = await this.prisma.chan.findUnique({
			where:
			{
				id: id,
				users: { some: { name: username } }
			},
			select: { ownerName: true }})
		if (!toCheck)
			throw new NotFoundException(`chan with id ${id} not found`)
		if (toCheck.ownerName === username) // the owner need to transfer the ownership before leaving or deleting the chan
			throw new ForbiddenException(`owner can't leave a chan`)
		const toNotify = (await this.prisma.chan.update({ where: { id: id },
			data:
			{
				users: { disconnect: { name: username } },
			},
			select:
			{
				users:
				{
					where: { name: { not: username } },
					select: { name: true }
				}
			}
		})).users
	const res = (await this.prisma.discussionEvent.create({
		data:
		{
			eventType: 'AUTHOR_LEAVED',
			discussionElement:
			{
				create:
				{
					chanId: id,
					author: username
				}
			}
		},
		select: { discussionElement: { select: this.discussionElementsSelect }}})).discussionElement
		toNotify.forEach(el => this.appService.pushEvent(el.name, { type: EventTypeList.CHAN_NEW_EVENT, data: { chanId: id, event: res } }))
	}
}
