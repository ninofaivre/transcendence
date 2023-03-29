import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { AppService } from 'src/app.service';
import { InvitationPathType } from './types/invitationPath.type';

enum EventTypeList
{
	NEW_FRIEND_INVITATION = "NEW_FRIEND_INVITATION",
	FRIEND_INVITATION_REFUSED = "FRIEND_INVITATION_REFUSED",
	FRIEND_INVITATION_CANCELED = "FRIEND_INVITATION_CANCELED",
}

@Injectable()
export class InvitationsService
{

	constructor(private readonly prisma: PrismaService,
				private readonly appService: AppService) {}


	private friendInvitationSelect:
	{
		id: true,
		creationDate: true,
		invitingUserName: true,
		invitedUserName: true,
	}


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
			await this.appService.pushEvent(invitedUsername, { type: EventTypeList.NEW_FRIEND_INVITATION, data: res })
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
			await this.appService.pushEvent(res.invitedUserName || res.invitingUserName,
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
}
