import { subject } from '@casl/ability';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FriendInvitationStatus, Prisma } from '@prisma/client';
import { NestRequestShapes, nestControllerContract } from '@ts-rest/nest';
import contract from 'contract/contract';
import { zInvitationFilterType } from 'contract/zod/inv.zod';
import { PrismaService } from 'nestjs-prisma';
import { Action, CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { FriendsService } from 'src/friends/friends.service';
import { SseService } from 'src/sse/sse.service';
import { UserService } from 'src/user/user.service';

const c = nestControllerContract(contract.invitations.friend)
type RequestShapes = NestRequestShapes<typeof c>

@Injectable()
export class FriendInvitationsService
{

	constructor(private readonly prisma: PrismaService,
			    private readonly casl: CaslAbilityFactory,
			    private readonly userService: UserService,
			    private readonly sse: SseService,
			    private readonly friendService: FriendsService) {}

	private friendInvitationSelect = Prisma.validator<Prisma.FriendInvitationSelect>()
	({
		id: true,
		creationDate: true,
		invitingUserName: true,
		invitedUserName: true,
		status: true,

	} satisfies Prisma.FriendInvitationSelect)

	private getFriendInvitationArgViaUser(status: FriendInvitationStatus[]): Prisma.FriendInvitationFindManyArgs
	{
		const arg: Prisma.FriendInvitationFindManyArgs =
		{
			where: { status: { in: status } },
			select: this.friendInvitationSelect,
			orderBy: { creationDate: 'asc' }
		}
		return arg
	}

	async getFriendInvitations(username: string, status: FriendInvitationStatus[])
	{
		const res = await this.userService.getUserByNameOrThrow(username,
			{
				incomingFriendInvitation: this.getFriendInvitationArgViaUser(status),
				outcomingFriendInvitation: this.getFriendInvitationArgViaUser(status),
			})
		return { incoming: res.incomingFriendInvitation, outcoming: res.outcomingFriendInvitation }
	}

	async getFriendInvitationsByType(username: string, type: zInvitationFilterType, status: FriendInvitationStatus[])
	{
		const res = await this.userService.getUserByNameOrThrow(username,
			{
				incomingFriendInvitation: type === 'INCOMING' && this.getFriendInvitationArgViaUser(status),
				outcomingFriendInvitation: type === 'OUTCOMING' && this.getFriendInvitationArgViaUser(status),
			})
		return res.outcomingFriendInvitation || res.incomingFriendInvitation
	}

	private async getFriendInvitationOrThrow<T extends Prisma.FriendInvitationSelect>(username: string, id: string, type: 'INCOMING' | 'OUTCOMING' | 'ANY', select: Prisma.SelectSubset<T, Prisma.FriendInvitationSelect>)
	{
		let whereArg = Prisma.validator<Prisma.FriendInvitationWhereUniqueInput>()
		({
			id: id,
			OR: [{}]
		})
		if (type === 'INCOMING' || type === 'ANY')
			whereArg.OR.push({ invitedUserName: username } satisfies Prisma.FriendInvitationWhereInput)
		if (type === 'OUTCOMING' || type === 'ANY')
			whereArg.OR.push({ invitingUserName: username } satisfies Prisma.FriendInvitationWhereInput)
		const res = await this.prisma.friendInvitation.findUnique({
			where: whereArg,
			select: select })
		if (!res)
			throw new NotFoundException(`not found friend invitation ${id}`)
		return res
	}

	async getFriendInvitationById(username: string, id: string)
	{
		return this.getFriendInvitationOrThrow(username, id, 'ANY', this.friendInvitationSelect)
	}

	async createFriendInvitation(invitingUserName: string, invitedUserName: string)
	{
		await Promise.all([this.casl.checkAbilitiesForUser(invitingUserName, [{ action: Action.Create, subject: subject('FriendInvitation', { invitedUserName: invitedUserName }) }]),
		await this.userService.getUserByNameOrThrow(invitedUserName, { name: true })])
		return this.prisma.friendInvitation.create({
			data:
			{
				invitingUserName: invitingUserName,
				invitedUserName: invitedUserName
			},
			select: this.friendInvitationSelect })
	}

	async updateIncomingFriendInvitation(username: string, newStatus: RequestShapes['updateIncomingFriendInvitation']['body']['status'], id: string)
	{
		const friendInvitation = await this.getFriendInvitationOrThrow(username, id, 'INCOMING', { status: true, invitedUserName: true, invitingUserName: true })
		await this.casl.checkAbilitiesForUser(username, [{ action: Action.Update, subject: subject('FriendInvitation', friendInvitation) }])
		if (newStatus === 'ACCEPTED')
			await this.friendService.createFriend(friendInvitation.invitingUserName, friendInvitation.invitedUserName)
		return this.prisma.friendInvitation.update({
			where: { id: id },
			data: { status: newStatus },
			select: this.friendInvitationSelect })
	}

	async updateOutcomingFriendInvitation(username: string, newStatus: RequestShapes['updateOutcomingFriendInvitation']['body']['status'], id: string)
	{
		const friendInvitation = await this.getFriendInvitationOrThrow(username, id, 'OUTCOMING', { status: true, invitedUserName: true, invitingUserName: true })
		await this.casl.checkAbilitiesForUser(username, [{ action: Action.Update, subject: subject('FriendInvitation', friendInvitation) }])
		return this.prisma.friendInvitation.update({
			where: { id: id },
			data: { status: newStatus },
			select: this.friendInvitationSelect })
	}
}
