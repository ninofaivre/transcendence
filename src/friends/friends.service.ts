import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime';
import { PrismaService } from 'nestjs-prisma';
import { DmsService } from 'src/dms/dms.service';
import { EventTypeList, SseService } from 'src/sse/sse.service';

@Injectable()
export class FriendsService
{

	constructor(private readonly prisma: PrismaService,
			   	private readonly sseService: SseService,
			    private readonly dmsService: DmsService) {}


	private friendShipSelect = Prisma.validator<Prisma.FriendShipSelect>()
	({
		id: true,
		creationDate: true,
		requestingUserName: true,
		requestedUserName: true,
		directMessage: { select: { id: true } },
	})

	private friendShipArgsForPayload = Prisma.validator<Prisma.FriendShipArgs>()
	({
		select: this.friendShipSelect
	})
	
	private formatFriendShip(friendShip: Prisma.FriendShipGetPayload<typeof this.friendShipArgsForPayload>)
	{
		const { directMessage, ...rest } = friendShip

		const directMessageId = directMessage?.id

		const formattedFriendShip =
		{
			...rest,
			directMessageId
		}
		return formattedFriendShip
	}

	public async createFriend(requestingUserName: string, requestedUserName: string)
	{
		let directMessageId = (await this.dmsService.findDmBetweenUsers(requestingUserName, requestedUserName, { id: true } ))?.id
		let newFriendShip = this.formatFriendShip(await this.prisma.friendShip.create({
			data:
			{
				requestingUserName: requestingUserName,
				requestedUserName: requestedUserName,
				...((directMessageId) ?
				{
					directMessage: { connect: { id: directMessageId } }
				} : {})
			},
			select: this.friendShipSelect }))
		await this.sseService.pushEventMultipleUser([requestingUserName, requestedUserName], { type: 'CREATED_FRIENDSHIP', data: newFriendShip })
		if (!directMessageId)
		{
			directMessageId = await this.dmsService.createDm(requestingUserName, requestedUserName, newFriendShip.id)
			newFriendShip = this.formatFriendShip(await this.prisma.friendShip.update({
				where: { id: newFriendShip.id },
				data:
				{
					directMessage:
					{
						connect: { id: directMessageId }
					}
				},
				select: this.friendShipSelect }))
			await this.sseService.pushEventMultipleUser([requestingUserName, requestedUserName], { type: 'UPDATED_FRIENDSHIP', data: newFriendShip })
		}
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
