import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventType, PermissionList, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { AppService } from 'src/app.service';
import { PermissionsService } from 'src/chans/permissions/permissions.service';
import { EventTypeList, SseService } from 'src/sse/sse.service';
import { ChanInvitationType } from './dto/getChanInvitations.path.dto';
import { InvitationPathType } from './types/invitationPath.type';

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

	async getFriendInvitations(username: string, filter?: InvitationPathType)
	{
		const res = await this.prisma.user.findUnique({ where: { name: username },
			select:
			{
				incomingFriendInvitation: (!filter || filter == 'INCOMING') && { select: this.friendInvitationSelect },
				outcomingFriendInvitation: (!filter || filter == 'OUTCOMING') && { select: this.friendInvitationSelect },
			}})
		if (!filter)
			return { incoming: res.incomingFriendInvitation, outcoming: res.outcomingFriendInvitation }
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

	async deleteFriendInvitation(username: string, type: InvitationPathType, id: number)
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

	async getChanInvitations(username: string, chanInvitationType?: ChanInvitationType)
	{
		const res = await this.prisma.user.findUnique({ where: { name: username },
			select:
			{
				incomingChanInvitation: (chanInvitationType !== 'OUTCOMING') && { select: this.chanInvitationsSelect },
				outcomingChanInvitation: (chanInvitationType !== 'INCOMING') && { select: this.chanInvitationsSelect },
			}})
		if (!chanInvitationType)
			return { incoming: res.incomingChanInvitation, outcoming: res.outcomingChanInvitation }
		return res.incomingChanInvitation || res.outcomingChanInvitation
	}

	async createChanInvitation(invitingUsername: string, invitedUsername: string, chanId: number)
	{
		const toCheck = await this.prisma.user.findUnique({
			where: { name: invitingUsername },
			select:
			{
				chans:
				{
					where: { id: chanId },
					select: { id: true }
				},
				friend:
				{
					where: { requestedUserName: invitedUsername },
					select: { id: true, directMessage: { select: { id: true } } },
				},
				friendOf:
				{
					where: { requestingUserName: invitedUsername },
					select: { id: true, directMessage: { select: { id: true } } },
				}
			}})
		const isInvitedUserAlreadyInChan = !!(await this.prisma.user.findUnique({ where: { name: invitedUsername },
			select: { chans: { where: { id: chanId }, select: { id: true } } } })).chans.length
		if (isInvitedUserAlreadyInChan)
			throw new ForbiddenException(`${invitedUsername} is already in chan with id ${chanId}`)
		if (!toCheck.chans.length)
			throw new NotFoundException(`chan with id ${chanId} not found`)
		if (!toCheck.friend.length && !toCheck.friendOf.length)
			throw new ForbiddenException(`${invitedUsername} is not in your friendList`)
		if (!await this.permissionsService.doesUserHasRightTo(invitingUsername, invitingUsername, PermissionList.INVITE, chanId))
			throw new ForbiddenException(`you don't have right to invite in this chan`)
		let newDirectMessageId
		if (!toCheck.friend[0]?.directMessage?.id && !toCheck.friendOf[0]?.directMessage?.id)
		{
			const res = await this.prisma.directMessage.create({
			data:
			{
				friendShipId: toCheck.friend[0]?.id || toCheck.friendOf[0]?.id,
				requestingUserName: invitingUsername,
				requestedUserName: invitedUsername 
			},
			select: this.appService.directMessageSelect})
			await this.sseService.pushEventMultipleUser([invitingUsername, invitedUsername], { type: EventTypeList.NEW_DM, data: res })
			newDirectMessageId = res.id
		}
		const res = await this.prisma.chanInvitation.create({
			data:
			{
				chan: { connect: { id: chanId } },
				friendShip: { connect: { id: toCheck.friend[0]?.id || toCheck.friendOf[0]?.id } },
				requestingUser: { connect: { name: invitingUsername } },
				requestedUser: { connect: { name: invitedUsername } },
				discussionEvent:
				{
					create:
					{
						concernedUserRelation: { connect: { name: invitedUsername } },
						eventType: EventType.PENDING_CHAN_INVITATION,
						chanInvitationRelated: { connect: { id: chanId } },
						discussionElement:
						{
							create:
							{
								authorRelation: { connect: { name: invitingUsername } },
								directMessage:
								{
									connect:
									{
										id: toCheck.friend[0]?.directMessage?.id || toCheck.friendOf[0]?.directMessage?.id || newDirectMessageId,
									}
								}
							}
						}
					}
				}
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
			}})
		const { discussionEvent, ...chanInvitation } = res
		const directMessageId = discussionEvent.discussionElement.directMessageId
		delete discussionEvent.discussionElement.directMessageId
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
					event: discussionEvent.discussionElement
				}
			})
		return chanInvitation
	}

	async deleteChanInvitation(username: string, invitationId: number, chanInvitationType: ChanInvitationType)
	{
		try
		{
			const { requestingUserName, requestedUserName, discussionEvent: { id: discussionEventId } } =
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
			const res = await this.prisma.discussionEvent.update({
				where: { id: discussionEventId },
				data:
				{
					eventType: (chanInvitationType === 'INCOMING') ? EventType.REFUSED_CHAN_INVITATION : EventType.CANCELED_CHAN_INVITATION
				},
				select: { discussionElement: { select: { directMessageId: true ,...this.appService.discussionElementsSelect } } }})
			const directMessageId: number = res.discussionElement.directMessageId
			delete res.discussionElement.directMessageId
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
						event: res.discussionElement
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
