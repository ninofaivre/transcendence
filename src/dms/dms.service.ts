import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { AppService } from 'src/app.service';

enum EventTypeList
{
	NEW_DM = 'NEW_DM'
}

@Injectable()
export class DmsService
{
	constructor(private readonly prisma: PrismaService,
			    private readonly appService: AppService) {}


	private directMessageSelect: Prisma.DirectMessageSelect =
	{
		id: true,
		requestedUserName: true,
		requestingUserName: true,
	}


	async getDms(username: string)
	{
		return this.prisma.directMessage.findMany({
			where:
			{
				OR:
				[
					{ requestedUserName: username },
					{ requestingUserName: username }
				]
			},
			select: this.directMessageSelect})
	}

	async createDm(username: string, friendUsername: string)
	{
		const toCheck = await this.prisma.user.findUniqueOrThrow({ where: { name: username },
			select:
			{
				friend:
				{
					where:
					{
						requestedUserName: friendUsername,
					},
					select: { id: true, directMessage: { select: { id: true } } },
					take: 1,
				},
				friendOf:
				{
					where:
					{
						requestingUserName: friendUsername,
					},
					select: { id: true, directMessage: { select: { id: true } } },
					take: 1,
				}
			}})
		if (!toCheck.friend.length && !toCheck.friendOf.length)
			throw new ForbiddenException(`${friendUsername} is not in your friendList !`)
		if (toCheck.friend[0].directMessage || toCheck.friendOf[0].directMessage)
			throw new ConflictException(`you already have a dm with ${friendUsername}`)
		const res = await this.prisma.directMessage.create({
			data:
			{
				friendShipId: toCheck.friend[0].id || toCheck.friend[0].id,
				requestingUserName: username,
				requestedUserName: friendUsername
			},
			select: this.directMessageSelect})
		this.appService.pushEvent(friendUsername, { type: EventTypeList.NEW_DM, data: res })
		return res
	}
}
