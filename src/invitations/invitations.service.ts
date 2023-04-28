import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { EventType, PermissionList, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { AppService } from 'src/app.service';
import { PermissionsService } from 'src/chans/permissions/permissions.service';
import { EventTypeList, SseService } from 'src/sse/sse.service';
import { InvitationFilter } from './zod/invitationFilter.zod';
import { zInvitationFilterType } from 'contract/zod/inv.zod';

@Injectable()
export class InvitationsService
{

	constructor(private readonly prisma: PrismaService,
				private readonly appService: AppService,
			    private readonly permissionsService: PermissionsService,
			    private readonly sseService: SseService) {}


	private friendInvitationSelect = Prisma.validator<Prisma.FriendInvitationSelect>()
	({
		id: true,
		creationDate: true,
		invitingUserName: true,
		invitedUserName: true,
	})

	private chanInvitationsSelect = Prisma.validator<Prisma.ChanInvitationSelect>()
	({
		id: true,
		chanId: true,
		friendShipId: true
	})

	async getAllFriendInvitations(username: string)
	{
		const res = await this.prisma.user.findUnique({ where: { name: username },
			select:
			{
				incomingFriendInvitation: { select: this.friendInvitationSelect },
				outcomingFriendInvitation: { select: this.friendInvitationSelect },
			}})
		if (!res)
			throw new InternalServerErrorException(`your account has beed deleted, please logout`)
		return { incoming: res.incomingFriendInvitation, outcoming: res.outcomingFriendInvitation }
	}

	async getFriendInvitationsByType(username: string, filter: zInvitationFilterType)
	{
		const res = await this.prisma.user.findUnique({ where: { name: username },
			select:
			{
				incomingFriendInvitation: (filter == 'INCOMING') && { select: this.friendInvitationSelect },
				outcomingFriendInvitation: (filter == 'OUTCOMING') && { select: this.friendInvitationSelect },
			}})
		if (!res)
			throw new InternalServerErrorException(`your account has beed deleted, please logout`)
		return res.incomingFriendInvitation || res.outcomingFriendInvitation
	}

	async createFriendInvitation(invitingUsername: string, invitedUsername: string)
	{
		if (invitingUsername === invitedUsername)
			throw new BadRequestException("self invitation")
		const toCheck = await this.prisma.user.findUnique({ where: { name: invitingUsername },
			select:
			{
				friend: { where: { requestedUserName: invitedUsername }, select: { id: true } },
				friendOf: { where: { requestingUserName: invitedUsername }, select: { id: true } },
				blockedUser: { where: { blockedUserName: invitedUsername }, select: { id: true } },
				blockedByUser: { where: { blockingUserName: invitedUsername }, select: { id: true } },
				incomingFriendInvitation: { where: { invitingUserName: invitedUsername }, select: { id: true } },
			}})
		if (!toCheck)
			throw new InternalServerErrorException(`your account has been deleted, please logout`)
		if (toCheck.friend.length || toCheck.friendOf.length)
			throw new ForbiddenException(`you are already friend with ${invitedUsername}`)
		if (toCheck.blockedUser.length)
			throw new ForbiddenException(`you blocked ${invitedUsername}`)
		if (toCheck.blockedByUser.length)
			throw new ForbiddenException(`you have been blocked by ${invitedUsername}`)
		if (toCheck.incomingFriendInvitation.length)
			throw new ForbiddenException(`${invitedUsername} already invited you`)
		try
		{
			const res = await this.prisma.friendInvitation.create({
				data:
				{
					invitingUserName: invitingUsername,
					invitedUserName: invitedUsername
				},
				select: this.friendInvitationSelect })
			await this.sseService.pushEvent(invitedUsername, { type: EventTypeList.NEW_FRIEND_INVITATION, data: res })
			return res
		}
		catch (e)
		{
			throw new ConflictException(`invitation for user ${invitedUsername} already exist`)
		}
	}

	async deleteFriendInvitation(username: string, type: InvitationFilter, id: number)
	{
		try
		{
			const res = await this.prisma.friendInvitation.delete({
				where:
				{
					id: id,
					invitedUserName: type === 'INCOMING' && username || undefined,
					invitingUserName: type === 'OUTCOMING' && username || undefined,
				},
				select:
				{
					invitedUserName: type === 'OUTCOMING',
					invitingUserName: type === 'INCOMING',
				}})
			await this.sseService.pushEvent(res.invitedUserName || res.invitingUserName,
				{
					type: type === 'INCOMING' && EventTypeList.FRIEND_INVITATION_REFUSED|| EventTypeList.FRIEND_INVITATION_CANCELED,
					data: { friendInvitationId: id }
				})
		}
		catch
		{
			throw new NotFoundException(`invitation with id ${id} not found`)
		}
	}

	async getAllChanInvitations(username: string)
	{
		const res = await this.prisma.user.findUnique({ where: { name: username },
			select:
			{
				incomingChanInvitation: { select: this.chanInvitationsSelect },
				outcomingChanInvitation: { select: this.chanInvitationsSelect },
			}})
		if (!res)
			throw new InternalServerErrorException(`your account has been deleted, please logout`)
		return { incoming: res.incomingChanInvitation, outcoming: res.outcomingChanInvitation }
	}

	async getChanInvitationsByType(username: string, chanInvitationType: InvitationFilter)
	{
		const res = await this.prisma.user.findUnique({ where: { name: username },
			select:
			{
				incomingChanInvitation: (chanInvitationType === 'INCOMING') && { select: this.chanInvitationsSelect },
				outcomingChanInvitation: (chanInvitationType === 'OUTCOMING') && { select: this.chanInvitationsSelect },
			}})
		if (!res)
			throw new InternalServerErrorException(`your account has been deleted, please logout`)
		return res.incomingChanInvitation || res.outcomingChanInvitation
	}

	// TODO: need to test a bit this 200 lines function lol
	async createChanInvitation(invitingUsername: string, invitedUsernames: string[], chanId: number)
	{
		const toCheck = await this.prisma.user.findUnique({
			where: { name: invitingUsername },
			select:
			{
				chans:
				{
					where: { id: chanId },
					select:
					{
						roles:
						{
							where: this.permissionsService.getRolesDoesUserHasRighTo(invitingUsername, invitingUsername, PermissionList.INVITE),
							select: { id: true },
							take: 1
						},
						title: true
					}
				},
				friend:
				{
					where: { requestedUserName: { in: invitedUsernames } },
					select: { id: true, requestedUserName: true, directMessage: { select: { id: true } } },
				},
				friendOf:
				{
					where: { requestingUserName: { in: invitedUsernames } },
					select: { id: true, requestingUserName: true, directMessage: { select: { id: true } } },
				},
				outcomingChanInvitation:
				{
					where: { requestedUserName: { in: invitedUsernames } },
					select: { id: true }
				}
			}})
		if (!toCheck)
			throw new InternalServerErrorException(`your account has been deleted, please logout`)
		if (!toCheck.chans.length)
			throw new ForbiddenException(`chan with id ${chanId} doesn't exist or your are not a member of it`)
		if (!toCheck.chans[0].roles.length)
			throw new ForbiddenException(`you don't have right to invite in this chan`)
		const friends: ({ id: number, otherUserName: string, directMessage: { id: number } | null })[] =
			Array.prototype.concat
			(
				toCheck.friend.map(el =>
					{
						const { requestedUserName, ...rest } = el
						return { otherUserName: requestedUserName, ...rest }
					}),
				toCheck.friendOf.map(el =>
					{
						const { requestingUserName, ...rest } = el
						return { otherUserName: requestingUserName, ...rest }
					})
			)
		if (friends.length < invitedUsernames.length)
			throw new ForbiddenException(`one of the users in ${invitedUsernames.toString} is not in your friendList`)
		const areInvitedUsersAlreadyInChan = (await this.prisma.chan.findUnique({
			where: { id: chanId },
			select:
			{
				users:
				{
					where: { name: { in: invitedUsernames } },
					select: { name: true },
					take: 1
				}
			}
		}))?.users.length
		if (areInvitedUsersAlreadyInChan)
			throw new ForbiddenException(`one of the users in ${invitedUsernames.toString} is already in chan with id ${chanId}`)
		if (toCheck.outcomingChanInvitation.length)
			throw new ConflictException(`one of the users in ${invitedUsernames.toString} has already an invitation from you for the chan with id ${chanId}`)
		const friendShipsNeedingNewDms = friends
			.filter(el => !el.directMessage)
			.map(el =>
				{
					return { friendShipId: el.id,
						requestingUserName: invitingUsername,
						requestedUserName: el.otherUserName }
				})
		await this.prisma.directMessage.createMany({ data: friendShipsNeedingNewDms })
		const newDms = await this.prisma.directMessage.findMany({
			where: { friendShipId: { in: friendShipsNeedingNewDms.map(el => el.friendShipId) } },
			select:
			{
				friendShip: { select: { requestingUserName: true, requestedUserName: true } },
				...this.appService.directMessageSelect
			}})
		await Promise.all(newDms.map(async el =>
			{
				if (!el.friendShip)
					return
				const { friendShip: { requestedUserName, requestingUserName }, ...dm } = el
				return this.sseService.pushEventMultipleUser([requestedUserName, requestingUserName],
					{
						type: EventTypeList.NEW_DM,
						data: dm
					})
			}))
		newDms.map(dm =>
		{
			const found = friends .find(el => el.otherUserName === dm.requestedUserName)
			if (!found)
				return
			found.directMessage = { id: dm.id }
		})
		await this.prisma.chanInvitation.createMany({
			data: await Promise.all(friends.map(async (el) =>
				{return {
					chanId: chanId,
					chanTitle: toCheck.chans[0].title || "",
					friendShipId: el.id,
					requestingUserName: invitingUsername,
					requestedUserName: el.otherUserName,
					discussionEventId: (await this.prisma.discussionEvent.create({
						data:
						{
							concernedUserRelation: { connect: { name: el.otherUserName } },
							eventType: EventType.PENDING_CHAN_INVITATION,
							chanInvitationRelated: { connect: { id: chanId } },
							discussionElement:
							{
								create:
								{
									authorRelation: { connect: { name: invitingUsername } },
									directMessage:
									{
										connect: { id: el.directMessage?.id }
									}
								}
							}
					}})).id
			}}))})
		const res = await this.prisma.chanInvitation.findMany({
			where:
			{
				chanId: chanId,
				friendShipId: { in: friends.map(el => el.id) },
				requestingUserName: invitingUsername,
			},
			select:
			{
				...this.chanInvitationsSelect,
				discussionEvent:
				{
					select:
					{
						discussionElement:
						{
							select: { ...this.appService.discussionElementsSelect, directMessageId: true }
						}
					}
				}
			} })
		return await Promise.all(res.map(async el =>
			{
				const { discussionEvent: { discussionElement: { directMessageId, ...discussionElement } }, ...chanInvitation } = el
				const invitedUsername = discussionElement.event?.concernedUser
				if (!invitedUsername)
					return chanInvitation
				await this.sseService.pushEvent(invitedUsername,
					{
						type: EventTypeList.CHAN_NEW_INVITATION,
						data: { chanInvitation }
					})
				await this.sseService.pushEventMultipleUser([invitedUsername, invitingUsername],
					{
						type: EventTypeList.DM_NEW_EVENT,
						data:
						{
							directMessageId: directMessageId,
							event: discussionElement
						}
					})
				return chanInvitation
			}))
	}

	async deleteChanInvitation(username: string, invitationId: number, chanInvitationType: InvitationFilter)
	{
		try
		{
			const { requestingUserName, requestedUserName, discussionEvent } =
				await this.prisma.chanInvitation.delete({ where:
					{
						id: invitationId,
						requestingUserName: chanInvitationType === 'OUTCOMING' && username || undefined,
						requestedUserName: chanInvitationType === 'INCOMING' && username || undefined,
					},
					select:
					{
						discussionEvent: { select: { id: true } },
						requestingUserName: chanInvitationType === 'INCOMING',
						requestedUserName: chanInvitationType === 'OUTCOMING',
					}})
			if (!discussionEvent)
				throw new InternalServerErrorException("something went bad lol")
			const res = await this.prisma.discussionEvent.update({
				where: { id: discussionEvent.id },
				data:
				{
					eventType: (chanInvitationType === 'INCOMING') ? EventType.REFUSED_CHAN_INVITATION : EventType.CANCELED_CHAN_INVITATION
				},
				select:
				{
					discussionElement:
					{
						select: { directMessageId: true ,...this.appService.discussionElementsSelect }
					}
				}})
			const { discussionElement: { directMessageId, ...discussionElement } } = res
			const ev1 = this.sseService.pushEvent(requestedUserName || requestingUserName,
				{
					type: (chanInvitationType === 'INCOMING') ? EventTypeList.CHAN_INVITATION_REFUSED : EventTypeList.FRIEND_INVITATION_CANCELED,
					data: { chanInvitationId: invitationId }
				})
			const ev2 = this.sseService.pushEventMultipleUser([requestedUserName || requestingUserName, username],
				{
					type: EventTypeList.DM_NEW_EVENT,
					data:
					{
						directMessageId: directMessageId,
						chanInvitationId: invitationId,
						event: discussionElement
					}
				})
			await Promise.all([ev1, ev2])
		}
		catch
		{
			throw new NotFoundException(`invitation with id ${invitationId} not found`)
		}
	}
}
