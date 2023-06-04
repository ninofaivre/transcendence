import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ClassicDmEventType, DirectMessageStatus, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime';
import { zFriendShipReturn } from 'contract/routers/friends';
import { PrismaService } from 'nestjs-prisma';
import { DmsService } from 'src/dms/dms.service';
import { EventTypeList, SseService } from 'src/sse/sse.service';
import { z } from 'zod';

@Injectable()
export class FriendsService
{

	constructor(private readonly prisma: PrismaService,
			   	private readonly sseService: SseService,
			    private readonly dmsService: DmsService) {}


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

	public async createFriend(requestingUserName: string, requestedUserName: string)
	{
		let directMessage = (await this.dmsService.findDmBetweenUsers(requestingUserName, requestedUserName, { id: true, status: true } ))
		let newFriendShip =await this.prisma.friendShip.create({
			data:
			{
				requestingUserName: requestingUserName,
				requestedUserName: requestedUserName,
			},
			select: this.friendShipSelect })
		await this.sseService.pushEvent(requestingUserName, { type: 'CREATED_FRIENDSHIP', data: this.formatFriendShip(newFriendShip, requestingUserName) })
		await this.sseService.pushEvent(requestedUserName, { type: 'CREATED_FRIENDSHIP', data: this.formatFriendShip(newFriendShip, requestedUserName) })
		let newDmId: string = "" // a bit dirty
		if (!directMessage)
			newDmId = await this.dmsService.createAndNotifyDm(requestingUserName, requestedUserName)
		const dmId = directMessage?.id || newDmId
		const newEvent = await this.dmsService.createClassicDmEvent(dmId, ClassicDmEventType.CREATED_FRIENDSHIP, requestedUserName)
		await this.sseService.pushEventMultipleUser([requestingUserName, requestedUserName], { type: 'CREATED_DM_EVENT', data: { dmId: dmId, element: newEvent } })
		if (directMessage && directMessage.status === DirectMessageStatus.DISABLED)
			await this.dmsService.updateAndNotifyDmStatus(directMessage.id, DirectMessageStatus.ENABLED, requestedUserName)
	}

	// async getFriends(username: string)
	// {
	// 	return this.prisma.friendShip.findMany({
	// 		where:
	// 		{
	// 			OR:
	// 			[
	// 				{ requestedUserName: username },
	// 				{ requestingUserName: username },
	// 			]
	// 		},
	// 		select: this.friendShipSelect })
	// }
	//
	// async acceptInvitation(username: string, id: number)
	// {
	// 	// try
	// 	// {
	// 		const { invitingUserName } = await this.prisma.friendInvitation.delete({
	// 			where:
	// 			{
	// 				invitedUserName: username,
	// 				id: id
	// 			},
	// 			select: { invitingUserName: true }})
	// 		const directMessage = await this.prisma.user.findUnique({ where: { name: username },
	// 			select:
	// 			{
	// 				directMessage:
	// 				{
	// 					where: { requestedUserName: invitingUserName },
	// 					select: { id: true },
	// 				},
	// 				directMessageOf:
	// 				{
	// 					where: { requestingUserName: invitingUserName },
	// 					select: { id: true }
	// 				}
	// 			}})
	// 		if (!directMessage)
	// 			throw new InternalServerErrorException(`your account has been deleted, please logout`)
	// 		const newFriendShip = await this.prisma.friendShip.create({
	// 			data:
	// 			{
	// 				requestingUser: { connect: { name: invitingUserName } },
	// 				requestedUser: { connect: { name: username } },
	// 				directMessage: (directMessage.directMessage.length || directMessage.directMessageOf.length) ?
	// 				{
	// 					connect:
	// 					{
	// 						id: directMessage.directMessage[0].id || directMessage.directMessageOf[0].id,
	// 					}
	// 				}: undefined
	// 			},
	// 			select: this.friendShipSelect })
	// 		await this.sseService.pushEvent(invitingUserName,
	// 			{
	// 				type: EventTypeList.NEW_FRIEND,
	// 				data: { deletedFriendInvitationId: id, friend: newFriendShip }
	// 			})
	// 		return { status: 201 as const, body: newFriendShip }
	// 	// }
	// 	// catch (e)
	// 	// {
	// 	// 	if (e instanceof PrismaClientKnownRequestError)
	// 	// 	{
	// 	// 		if (e.code === 'P2025')
	// 	// 			return { status: 403 as const, body: `invitation with id ${id} not found` }
	// 	// 		if (e.code === 'P2002')
	// 	// 			return { status: 409 as const, body: `friendship already exist` }
	// 	// 	}
	// 	// }
	// }
	//
	// async deleteFriend(username: string, id: number)
	// {
	// 	try
	// 	{
	// 		const { requestedUserName, requestingUserName } = await this.prisma.friendShip.delete({
	// 			where: { id: id },
	// 			select:
	// 			{
	// 				requestedUserName: true,
	// 				requestingUserName: true,
	// 			}})
	// 		await this.sseService.pushEvent((username === requestedUserName) ? requestingUserName : requestedUserName,
	// 			{
	// 				type: EventTypeList.DELETED_FRIEND,
	// 				data: { deletedFriendId: id }
	// 			})
	// 	}
	// 	catch
	// 	{
	// 		throw new NotFoundException(`friendship with id ${id} not found`)
	// 	}
	// }
}
