import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ClassicDmEventType, DirectMessageStatus, Prisma, dmPolicyLevelType } from '@prisma/client';
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError, PrismaClientValidationError } from '@prisma/client/runtime';
import { zFriendShipReturn } from 'contract/routers/friends';
import { PrismaService } from 'nestjs-prisma';
import { ChansService } from 'src/chans/chans.service';
import { DmsService } from 'src/dms/dms.service';
import { EventTypeList, SseService } from 'src/sse/sse.service';
import { UserService } from 'src/user/user.service';
import { z } from 'zod';

@Injectable()
export class FriendsService
{

	constructor(private readonly prisma: PrismaService,
			   	private readonly sse: SseService,
			    private readonly dmsService: DmsService,
			    private readonly usersService: UserService,
			    private readonly chansService: ChansService) {}


	private friendShipSelect =
	{
		id: true,
		creationDate: true,
		requestingUserName: true,
		requestedUserName: true,
	} satisfies Prisma.FriendShipSelect

	private friendShipGetPayload =
	{
		select: this.friendShipSelect
	} satisfies Prisma.FriendShipArgs
	
	private formatFriendShip(friendShip: Prisma.FriendShipGetPayload<typeof this.friendShipGetPayload>, username: string)
	: z.infer<typeof zFriendShipReturn>
	{
		const { requestedUserName, requestingUserName, ...rest } = friendShip
		const formattedFriendShip =
		{
			...rest,
			friendName: (requestedUserName === username) ? requestingUserName : requestedUserName
		}
		return formattedFriendShip
	}

	private formatFriendShipArray(friendShips: Prisma.FriendShipGetPayload<typeof this.friendShipGetPayload>[], username: string)
	: z.infer<typeof zFriendShipReturn>[]
	{
		return friendShips.map(friendShip => this.formatFriendShip(friendShip, username))
	}

	public async createFriend(requestingUserName: string, requestedUserName: string)
	{
		const directMessage = (await this.dmsService.findDmBetweenUsers(requestingUserName, requestedUserName, { id: true, status: true } ))
		const newFriendShip = await this.prisma.friendShip.create({
			data:
			{
				requestingUserName: requestingUserName,
				requestedUserName: requestedUserName,
			},
			select: this.friendShipSelect })
		await this.sse.pushEvent(requestingUserName, { type: 'CREATED_FRIENDSHIP', data: this.formatFriendShip(newFriendShip, requestingUserName) })
		await this.sse.pushEvent(requestedUserName, { type: 'CREATED_FRIENDSHIP', data: this.formatFriendShip(newFriendShip, requestedUserName) })
		let newDmId: string = "" // a bit dirty
		if (!directMessage)
			newDmId = await this.dmsService.createAndNotifyDm(requestingUserName, requestedUserName)
		const dmId = directMessage?.id || newDmId
		const newEvent = await this.dmsService.createClassicDmEvent(dmId, ClassicDmEventType.CREATED_FRIENDSHIP, requestedUserName)
		await this.sse.pushEventMultipleUser([requestingUserName, requestedUserName], { type: 'CREATED_DM_ELEMENT', data: { dmId: dmId, element: newEvent } })
		if (directMessage && directMessage.status === DirectMessageStatus.DISABLED)
			await this.dmsService.updateAndNotifyDmStatus(directMessage.id, DirectMessageStatus.ENABLED, requestedUserName)
	}

	// bien crade mais techniquement ça devrait marcher
	public async deleteFriend(username: string, friendShipId: string)
	{
		try
		{
			const { requestingUserName, requestedUserName } = await this.prisma.friendShip.delete({
				where:
				{
					id: friendShipId,
					OR:
					[
						{ requestedUserName: username },
						{ requestingUserName: username }
					]
				}, select: { requestingUserName: true, requestedUserName: true } })
			const { dmPolicyLevel: requestingUserDmPolicyLevel } = (await this.usersService.getUserByNameOrThrow(requestingUserName, { dmPolicyLevel: true }))
			const { dmPolicyLevel: requestedUserDmPolicyLevel } = (await this.usersService.getUserByNameOrThrow(requestedUserName, { dmPolicyLevel: true }))
			await this.sse.pushEventMultipleUser([requestingUserName, requestedUserName], { type: 'DELETED_FRIENDSHIP', data: { friendShipId: friendShipId } })
			const res = await this.dmsService.findDmBetweenUsers(requestingUserName, requestedUserName, { id: true })
			if (!res) // should never happen as dms is auto created at friendShip Creation and there should not be any way of deleting a dm
				throw new NotFoundException(`not found dm between ${requestedUserName} and ${requestingUserName}`)
			const { id: dmId } = res
			if ((requestingUserDmPolicyLevel === dmPolicyLevelType.ONLY_FRIEND || requestedUserDmPolicyLevel === dmPolicyLevelType.ONLY_FRIEND) ||
				((requestingUserDmPolicyLevel === dmPolicyLevelType.IN_COMMON_CHAN || requestedUserDmPolicyLevel === dmPolicyLevelType.IN_COMMON_CHAN) &&
			    	!(await this.chansService.doesUsersHasCommonChan(requestingUserName, requestedUserName))))
				await this.dmsService.updateAndNotifyDmStatus(dmId, DirectMessageStatus.DISABLED, username) // mb not username
		}
		catch (e)
		{
			if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025')
				throw new NotFoundException(`not found friendShip ${friendShipId}`)
			else
				throw e
		}
	}

	async getFriends(username: string)
	{
		return this.formatFriendShipArray(await this.prisma.friendShip.findMany({
			where:
			{
				OR:
				[
					{ requestedUserName: username },
					{ requestingUserName: username },
				]
			},
			select: this.friendShipSelect }), username)
	}
}
