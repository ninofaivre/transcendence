import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ChanType, EventType, PermissionList, Prisma, RoleApplyingType } from '@prisma/client';
import { compareSync, hash } from 'bcrypt';
import { PrismaService } from 'nestjs-prisma';
import { CreateChanDTO, CreateChanSchema } from './dto/createChan.dto';
import { AppService } from 'src/app.service';
import { CreateChanMessageDTO } from './dto/createChanMessage.dto';
import { PermissionsService } from './permissions/permissions.service';
import { EventTypeList, SseService } from 'src/sse/sse.service';
import { UpdateChanDTO } from './dto/updateChan.dto';

@Injectable()
export class ChansService
{

	constructor(private readonly prisma: PrismaService,
				private readonly permissionsService: PermissionsService,
			    private readonly appService: AppService,
			    private readonly sseService: SseService) {}


	private usersSelect = Prisma.validator<Prisma.UserSelect>()
	({
		name: true,
	})

	private rolesSelect = Prisma.validator<Prisma.RoleSelect>()
	({
		permissions: true,
		roleApplyOn: true,
		roles: { select: { name: true } },
		name: true,
		users: { select: this.usersSelect },
	})

	private rolesGetPayload = Prisma.validator<Prisma.RoleArgs>()
	({
		select: this.rolesSelect
	})

	private chansSelect = Prisma.validator<Prisma.ChanSelect>()
	({
		id: true,
		title: true,
		type: true,
		ownerName: true,
		users: { select: this.usersSelect },
		roles: { select: this.rolesSelect },
	})

	private discussionEventsSelect = Prisma.validator<Prisma.DiscussionEventSelect>()
	({
		eventType: true,
		concernedUser: true,
	})

	private discussionMessagesSelect = Prisma.validator<Prisma.DiscussionMessageSelect>()
	({
		content: true,
		relatedId: true,
		relatedUsers: { select: { name: true } },
		relatedRoles: { select: { name: true } },
	})

	private discussionElementsSelect = Prisma.validator<Prisma.DiscussionElementSelect>()
	({
		id: true,
		event: { select: this.discussionEventsSelect },
		message: { select: this.discussionMessagesSelect },
		author: true,
		creationDate: true
	})

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

	private namesArrayToStringArray(users: { name: string }[])
	{
		return users.map(el => el.name)
	}

	private formatRole(role: Prisma.RoleGetPayload<typeof this.rolesGetPayload>)
	{
		const { roles, users, ...rest } = role
		return {
			roles: this.namesArrayToStringArray(roles),
			users: this.namesArrayToStringArray(users),
			...rest
		}
	}

	formatChan(chan: Prisma.PromiseReturnType<typeof this.createChan>)
	{
		const { roles, users, ...rest } = chan
		return {
			users: this.namesArrayToStringArray(users),
			roles: roles.map(el => this.formatRole(el)),
			...rest
		}
	}

	async getUserChans(username: string)
	{
		// TODO: test later if find user then select chan is faster
		return this.prisma.chan.findMany({
			where:
			{
				users: { some: { name: username } }
			},
			select: this.chansSelect,
			orderBy: { type: 'desc' }})
	}

	async createChan(username: string, chan: CreateChanDTO)
	{
		if (chan.password)
			chan.password = await hash(chan.password, 10)
		try
		{
			const res = await this.prisma.chan.create({
				data:
				{
					...chan,
					owner: { connect: { name: username } },
					users: { connect: { name: username } },
					roles:
					{
						createMany:
						{
							data:
							[
								{
									name: 'DEFAULT',
									permissions: this.defaultPermissions,
									roleApplyOn: RoleApplyingType.NONE,
								},
								{
									name: 'ADMIN',
									permissions: this.adminPermissions,
									roleApplyOn: RoleApplyingType.ROLES,
								}
							]
						},
					},
				},
				select: this.chansSelect})
			await this.prisma.role.update({ where: { chanId_name: { chanId: res.id, name: 'ADMIN'} },
				data:
				{
					roles: { connect: { chanId_name: { chanId: res.id, name: 'DEFAULT' } } }
				}})
			res.roles.find(el => el.name === 'ADMIN')?.roles.push({ name: "DEFAULT" })
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
					where: this.permissionsService.getRolesDoesUserHasRighTo(username, username, PermissionList.DESTROY),
					take: 1,
					select: { id: true }
				},
				ownerName: true,
				invitations: { select: { discussionEventId: true } }
			}})
		if (!toCheck)
			throw new NotFoundException("chan not found")
		if (!toCheck.roles.length && toCheck.ownerName !== username)
			throw new ForbiddenException("you don't have right to destroy this chan")
		
		/* Update Invitations Dms Events */
		const invitations = toCheck.invitations.filter(el => el.discussionEventId != null)
		await this.prisma.discussionEvent.updateMany({
			where: { id: { in: invitations.map(el => el.discussionEventId) } },
			data:
			{
				eventType: EventType.CHAN_DELETED_INVITATION
			}})
		const newEvents = (await this.prisma.discussionEvent.findMany({
			where: { id: { in: toCheck.invitations.map(el => el.discussionEventId) } },
			select:
			{
				discussionElement:
				{
					select:
					{
						directMessage: { select: { id: true, requestingUserName: true, requestedUserName: true } },
						...this.appService.discussionElementsSelect
					}
				}
			}})).map(el => el.discussionElement)

			await Promise.all(newEvents.map(async ev =>
			{
				const { directMessage, ...event } = ev
				if (!directMessage)
					return
				return this.sseService.pushEventMultipleUser([directMessage.requestingUserName, directMessage.requestedUserName],
					{
						type: EventTypeList.DM_NEW_EVENT,
						data:
						{
							directMessageId: directMessage.id,
							event: event
						}
					})
			}))
		/* Update Invitations Dms Events */

		const toNotify = (await this.prisma.chan.delete({
			where: { id: id },
			select:
			{
				users: { select: this.usersSelect }
			}})).users
		toNotify.forEach(el => this.sseService.pushEvent(el.name, { type: EventTypeList.CHAN_DELETED, data: { chanId: id } }))
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
			eventType: EventType.AUTHOR_LEAVED,
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
		toNotify.forEach(el => this.sseService.pushEvent(el.name, { type: EventTypeList.CHAN_NEW_EVENT, data: { chanId: id, event: res } }))
	}

	async createChanMessage(username: string, chanId: number, content: string, relatedId?: number, usersAt?: string[])
	{
		return (await this.prisma.discussionMessage.create({
			data:
			{
				content: content,
				relatedUsers: usersAt &&
				{
					connect: usersAt.map(el => { return { name: el } })
				},
				related: (relatedId) ?
				{
					connect: { id: relatedId }
				}: undefined,
				discussionElement:
				{
					create:
					{
						chanId: chanId,
						author: username,
					}
				}
			},
			select:
			{
				discussionElement: { select: this.discussionElementsSelect }
			}})).discussionElement
	}

	async removeMutedIfUntilDateReached(state: any)
	{
		if (!state.untilDate || new Date() < state.untilDate)
			return false
		await this.prisma.mutedUserChan.delete({ where: { id: state.id } , select: { id: true } })
		return true
	}

	async createChanMessageIfRightTo(username: string, chanId: number, dto: CreateChanMessageDTO)
	{
		const { relatedId, content, usersAt } = dto
		const toCheck = await this.prisma.chan.findUnique({
			where:
			{
				id: chanId,
				users: { some: { name: username } },
			},
			select:
			{
				ownerName: true,
				elements: !!relatedId &&
				{
					where: { id: relatedId },
					select: { id: true },
				},
				users: { select: { name: true } },
				roles:
				{
					where: this.permissionsService.getRolesDoesUserHasRighTo(username, username, PermissionList.SEND_MESSAGE),
					take: 1,
					select: { id: true },
				},
				mutedUsers:
				{
					where: { mutedUserName: username },
					take: 1,
					select: { mutedUserName: true, untilDate: true, id: true },
				}
			}})
		if (!toCheck)
			throw new NotFoundException(`chan with id ${chanId} not found`)
		if (relatedId && !toCheck.elements.length)
			throw new ForbiddenException(`msg with id ${relatedId} not found`)
		if (usersAt && usersAt.every(userAt => !!toCheck.users.find(el => el.name === userAt)))
			throw new ForbiddenException(`some users at not found`)
		if (!toCheck.roles.length && toCheck.ownerName !== username)
			throw new ForbiddenException(`you don't have right to send msg`)
		if (toCheck.mutedUsers.length) // TODO: need to perform a check because unMute will probably be handled with a set timeOut but need to check if serv has been restarded before all setTimeOut completed
		{
			if (!(await this.removeMutedIfUntilDateReached(toCheck.mutedUsers[0])))
				throw new ForbiddenException(`you are muted`)
		}
		const res = await this.createChanMessage(username, chanId, content, relatedId, usersAt)
		await this.notifyChanMessage(toCheck.users, chanId, res)
		return res
	}

	async getChanMessages(username: string, chanId: number, nMessages: number, start?: number)
	{
		const res = await this.prisma.chan.findUnique({
			where:
			{
				id: chanId,
				users: { some: { name: username } }
			},
			select:
			{
				elements:
				{
					cursor: (start) ? { id: start } : undefined,
					orderBy: { id: 'desc' },
					take: nMessages,
					skip: Number(!!start),
					select: this.discussionElementsSelect,
				}
			}})
		if (!res)
			throw new NotFoundException(`chan with id ${chanId} not found`)
		return res.elements.reverse()
	}

	async deleteChanMessage(username: string, chanId: number, msgId: number)
	{
		const toCheck = await this.prisma.chan.findUnique({
			where:
			{
				id: chanId,
				users: { some: { name: username } }
			},
			select:
			{
				elements:
				{
					where:
					{
						id: msgId,
						message: { discussionElementId: msgId }
					},
					select:
					{
						message: { select: { id: true } },
						author: true
					},
					take: 1
				},
				users:
				{
					where: { name: { not: username } },
					select: { name: true }
				}
			}})
		if (!toCheck)
			throw new NotFoundException(`chan with id ${chanId} not found`)
		if (!toCheck.elements.length)
			throw new NotFoundException(`msg with id ${msgId} not found in chan with id ${chanId}`)
		const author = toCheck.elements[0].author
		if (!(await this.permissionsService.doesUserHasRightTo(username, author, PermissionList.DELETE_MESSAGE, chanId)))
			throw new ForbiddenException(`you don't have the right to do delete this msg`)
		const res = await this.prisma.discussionElement.update({ where: { id: msgId },
			data:
			{
				message: { delete: {} },
				event: { create: { eventType: EventType.MESSAGE_DELETED } },
			},
			select: this.discussionElementsSelect})
		await this.notifyChanEvent(toCheck.users, chanId, res)
	}

	async kickUserFromChan(username: string, toKick: string, chanId: number)
	{
		const toCheck = await this.prisma.chan.findUnique({
			where:
			{
				id: chanId,
				users: { some: { name: username } }
			},
			select:
			{
				users: { where: { name: toKick }, select: { name: true }, take: 1 },
				roles:
				{
					where: this.permissionsService.getRolesDoesUserHasRighTo(username, toKick, PermissionList.KICK),
					select: { id: true },
					take: 1
				},
				ownerName: true
			}})
		if (!toCheck)
			throw new NotFoundException(`chan with id ${chanId} not found`)
		if (!toCheck.users.length)
			throw new NotFoundException(`user ${toKick} doesn't exist in chan with id ${chanId}`)
		if (!toCheck.roles.length || toCheck.ownerName === toKick)
			throw new ForbiddenException(`you don't have right to kick ${toKick}`)
		const toNotify = (await this.prisma.chan.update({ where: { id: chanId },
			data:
			{
				users: { disconnect: { name: toKick } }
			},
			select:
			{
				users:
				{
					where: { name: { not: username } },
					select: { name: true },
				}
			}})).users
		toNotify.push({ name: toKick })
		await this.notifyChanEvent(toNotify, chanId, await this.createChanEvent(username, chanId, EventType.AUTHOR_KICKED_CONCERNED, toKick))
	}

	async createChanEvent(author: string, chanId: number, eventType: EventType, concerned?: string)
	{
		return (await this.prisma.discussionEvent.create({
			data:
			{
				eventType: eventType,
				concernedUserRelation: (concerned) ? { connect: { name: concerned } }: undefined,
				discussionElement:
				{
					create:
					{
						authorRelation: { connect: { name: author } },
						chan: { connect: { id: chanId } }
					}
				}
			},
			select:
			{
				discussionElement: { select: this.discussionElementsSelect }
			}})).discussionElement
	}

	async notifyChanEvent(users: { name: string }[], chanId: number, event: Prisma.PromiseReturnType<typeof this.createChanEvent>)
	{
		return this.sseService.pushEventMultipleUser(users.map(el => el.name),
			{
				type: EventTypeList.CHAN_NEW_EVENT,
				data: { chanId: chanId, event: event }
			})
	}

	async notifyChanMessage(users: { name: string }[], chanId: number, message: Prisma.PromiseReturnType<typeof this.createChanMessage>)
	{
		return this.sseService.pushEventMultipleUser(users.map(el => el.name),
			{
				type: EventTypeList.CHAN_NEW_MESSAGE,
				data: { chanId: chanId, message: message }
			})
	}

	private async addUserToChan(username: string, chanId: number)
	{
		const res = await this.prisma.chan.update({ where: { id: chanId },
			data: { users: { connect: { name: username } } },
			select: this.chansSelect})
		if (res.roles.some(el => el.name === 'DEFAULT'))
		{
			await this.prisma.role.update({
				where: { chanId_name: { chanId: chanId, name: 'DEFAULT' } },
				data: { users: { connect: { name: username } }}})
		}
		const newEvent = await this.prisma.discussionElement.create({
			data:
			{
				chan: { connect: { id: chanId } },
				authorRelation: { connect: { name: username } },
				event:
				{
					create:
					{
						eventType: EventType.AUTHOR_JOINED
					}
				}
			},
			select: this.appService.discussionElementsSelect})
		
		await this.sseService.pushEventMultipleUser(res.users.map(el => el.name),
			{
				type: EventTypeList.CHAN_NEW_EVENT,
				data: { chanId: chanId, event: newEvent }
			})
		return res
	}

	async deleteAllInvitationsToChanForUser(username: string, chanId: number)
	{
		// Get all Invitations
		let invitations = (await this.prisma.user.findUnique({ where: { name: username },
			select:
			{
				incomingChanInvitation:
				{
					where: { chanId: chanId },
					select:
					{
						id: true,
						requestingUserName: true,
						discussionEvent: { select: { id: true } },
						friendShip: { select: { directMessage: { select: { id: true } } } }
					}
				}
			}}))?.incomingChanInvitation

		if (!invitations)
			throw new InternalServerErrorException(`your account has been permanently deleted, please logout`)
		// Delete all Invitations
		await this.prisma.chanInvitation.deleteMany({ where: { id: { in: invitations.map(el => el.id) } } })

		// Update all invitations events in dms
		await this.prisma.discussionEvent.updateMany({
			where: { id: { in: invitations.filter(el => !!el.discussionEvent).map(el => el.discussionEvent.id) } },
			data:
			{
				eventType: EventType.ACCEPTED_CHAN_INVITATION,
			}})

		// select on findMany because not possible on updateMany
		const newEvents = (await this.prisma.discussionEvent.findMany({
			where: { id: { in: invitations.map(el => el.discussionEvent.id) } },
			select:
			{
				discussionElement:
				{
					select:
					{
						directMessage: { select: { id: true, requestingUserName: true, requestedUserName: true } },
						...this.appService.discussionElementsSelect
					}
				}
			}})).map(el => el.discussionElement)

		// sse notify for updated invitations events in dms
		await Promise.all(newEvents.map(async ev =>
			{
				const { directMessage, ...event } = ev
				if (!directMessage)
					return
				return this.sseService.pushEventMultipleUser([directMessage.requestingUserName, directMessage.requestedUserName],
					{
						type: EventTypeList.DM_NEW_EVENT,
						data:
						{
							directMessageId: directMessage.id,
							event: event
						}
					})
			}))
	}

	async pushUserToChanAndEmitDmEvent(username: string, chanId: number)
	{
		const newChan = await this.addUserToChan(username, chanId)
		await this.deleteAllInvitationsToChanForUser(username, chanId)
		return newChan
	}

	async joinChanByInvitation(username: string, chanInvitationId: number) // need to split this dirty func
	{
		const toCheck = await this.prisma.chanInvitation.findUnique({
			where:
			{
				id: chanInvitationId,
				requestedUserName: username
			},
			select: { chanId: true }})
		if (!toCheck)
			throw new ForbiddenException(`chanInvitation with id ${chanInvitationId} not found`)
		return this.pushUserToChanAndEmitDmEvent(username, toCheck.chanId)
	}

	async joinChanByid(username: string, chanId: number, password?: string)
	{
		const toCheck = await this.prisma.chan.findUnique({
			where:
			{
				id: chanId,
				type: ChanType.PUBLIC
			},
			select:
			{
				password: true
			}
		})
		if (!toCheck)
			throw new ForbiddenException(`chan with id ${chanId} does not exist or is PRIVATE`)
		if (!toCheck.password && password)
			throw new BadRequestException(`chan with id ${chanId} does not have password but one was provided`)
		if (toCheck.password && (!password || !compareSync(password, toCheck.password)))
			throw new ForbiddenException(`wrong password`)

		return this.pushUserToChanAndEmitDmEvent(username, chanId)
	}

	async searchChans(titleContains: string, nRes: number)
	{
		const res = await this.prisma.chan.findMany({
			where:
			{
				type: ChanType.PUBLIC,
				title: { contains: titleContains },
			},
			select: { id: true, title: true, _count: { select: { users: true } }, password: true },
			take: nRes,
			orderBy: { title: 'asc' }
		})
		return res.map(el => { 
			const hasPassword: boolean = !!el.password
			const { password, _count, ...trimmedEl } = el
			return { hasPassword, nUsers: _count.users,...trimmedEl }
		})
	}

	// TODO: test updateChan (untested)
	async updateChan(username: string, chanId: number, dto: UpdateChanDTO)
	{
		const res = await this.prisma.chan.findUnique({ where: { id: chanId },
			select:
			{
				roles:
				{
					where: this.permissionsService.getRolesDoesUserHasRighTo(username, username, PermissionList.EDIT),
					select: { name: true },
					take: 1
				},
				type: true,
				title: true,
				password: true
			}})
		if (!res)
			throw new NotFoundException(`chan with id ${chanId} not found`)
		if (!res.roles.length)
			throw new ForbiddenException(`you don't have right to edit chan with id ${chanId}`)
		if (res.type !== dto.type)
		{
			const error = CreateChanSchema.safeParse({ title: res.title, password: res.password, ...dto })
			if (!error.success)
			{
				console.log(error.error)
				throw new ForbiddenException(`request don't work with already existent data : ${error.error}`)
			}
		}
		// TODO: notify all members of the chan by sse
		return this.prisma.chan.update({ where: { id: chanId }, data: { ...dto }, select: this.chansSelect })
	}

}
