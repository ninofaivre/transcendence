import {
	ForbiddenException,
	Inject,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	forwardRef,
} from "@nestjs/common"
import {
	ClassicDmEventType,
	DeletedMessageDmDiscussionEventModel,
	DirectMessageStatus,
	DmDiscussionEventModel,
	Prisma,
} from "prisma-generated"
import { SseService } from "src/sse/sse.service"
import { z } from "zod"
import { DmEvent, zDmDiscussionElementReturn, zDmReturn } from "contract"
import { ElementUnion, EventUnion, RetypedElement, RetypedEvent, Tx } from "src/types"
import { PrismaService } from "src/prisma/prisma.service"
import { UserService } from "src/user/user.service"
import type { zDmDiscussionEventReturn, zDmDiscussionMessageReturn } from "contract"

@Injectable()
export class DmsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly sse: SseService,
		@Inject(forwardRef(() => UserService))
		private readonly usersService: UserService,
	) {}

	private directMessageSelect = {
		id: true,
		creationDate: true,
		status: true,
	} satisfies Prisma.DirectMessageSelect

	public getDirectMessageSelect(username: string) {
		// const userArg = {
		//     select: {
		//         statusVisibilityLevel: true,
		//         ...this.usersService.getProximitySelect(username),
		//         name: true
		//     }
		// } satisfies Prisma.UserArgs
		return {
			requestedUser: {
				select: {
					friend: {
						where: {
							requestedUserName: username,
							requestedUser: { statusVisibilityLevel: { not: "NO_ONE" } },
						},
						select: { id: true },
					},
					friendOf: {
						where: {
							requestingUserName: username,
							requestingUser: { statusVisibilityLevel: { not: "NO_ONE" } },
						},
						select: { id: true },
					},
					chans: {
						where: { users: { some: { name: username } } },
						take: 1,
					},
					name: true,
					statusVisibilityLevel: true,
				},
			},
			requestingUser: {
				select: {
					friend: {
						where: {
							requestedUserName: username,
							requestedUser: { statusVisibilityLevel: { not: "NO_ONE" } },
						},
						select: { id: true },
					},
					friendOf: {
						where: {
							requestingUserName: username,
							requestingUser: { statusVisibilityLevel: { not: "NO_ONE" } },
						},
						select: { id: true },
					},
					chans: {
						where: { users: { some: { name: username } } },
						take: 1,
					},
					name: true,
					statusVisibilityLevel: true,
				},
			},
			...this.directMessageSelect,
		} satisfies Prisma.DirectMessageSelect
	}

	private directMessageContextSelect = {
		...this.directMessageSelect,
		requestingUserName: true,
		requestedUserName: true,
	} satisfies Prisma.DirectMessageSelect

	private directMessageContextGetPayload = {
		select: this.directMessageContextSelect,
	}

	private directMessageGetPayload = {
		select: this.getDirectMessageSelect("example"),
	} satisfies Prisma.DirectMessageArgs

	private dmDiscussionEventSelect = {
		classicDmDiscussionEvent: { select: { eventType: true } },
		chanInvitationDmDiscussionEvent: {
			select: { chanInvitation: { select: { invitingUserName: true, chanTitle: true } } },
		},
		deletedMessageDmDiscussionEvent: { select: { author: true } },
		blockedDmDiscussionEvent: { select: { blockedUserName: true, blockingUserName: true } },
	} satisfies Prisma.DmDiscussionEventSelect & Record<EventUnion, true | object>

	private dmDiscussionEventGetPayload = {
		select: this.dmDiscussionEventSelect,
	} satisfies Prisma.DmDiscussionEventArgs

	private dmDiscussionMessageSelect = {
		content: true,
		relatedTo: true,
		author: true,
		modificationDate: true,
	} satisfies Prisma.DmDiscussionMessageSelect

	private dmDiscussionMessageGetPayload = {
		select: this.dmDiscussionMessageSelect,
	} satisfies Prisma.DmDiscussionMessageArgs

	private dmDiscussionElementSelect = {
		id: true,
		creationDate: true,
		message: { select: this.dmDiscussionMessageSelect },
		event: { select: this.dmDiscussionEventSelect },
	} satisfies Prisma.DmDiscussionElementSelect & Record<ElementUnion, true | object>

	private dmDiscussionElementGetPayload = {
		select: this.dmDiscussionElementSelect,
	} satisfies Prisma.DmDiscussionElementArgs

	public formatDirectMessage(
		dm: Prisma.DirectMessageGetPayload<typeof this.directMessageGetPayload>,
		username: string, //: z.infer<typeof zDmReturn> // BUG
	) {
		const { requestingUser, requestedUser, ...rest } = dm

		const other = username === requestedUser.name ? requestingUser : requestedUser

		const formattedDirectMessage: z.infer<typeof zDmReturn> = {
			...rest,
			otherName: other.name,
			otherStatus: this.usersService.getUserStatusFromVisibilityAndProximityLevel(
				{
					name: other.name,
					visibility: other.statusVisibilityLevel,
				},
				this.usersService.getProximityLevel(other),
			),
		}
		return formattedDirectMessage
	}

	private formatDirectMessageArray(
		dms: Prisma.DirectMessageGetPayload<typeof this.directMessageGetPayload>[],
		username: string,
	): z.infer<typeof zDmReturn>[] {
		return dms.map((dm) => this.formatDirectMessage(dm, username))
	}

	private formatDmEventForUser(
		element: Omit<
			Prisma.DmDiscussionElementGetPayload<typeof this.dmDiscussionElementGetPayload>,
			"message" | "event"
		>,
		event: Extract<
			RetypedEvent<
				Prisma.DmDiscussionEventGetPayload<typeof this.dmDiscussionEventGetPayload>
			>,
			{ deletedMessageDmDiscussionEvent: null }
		>,
		username: string,
		dm: Prisma.DirectMessageGetPayload<typeof this.directMessageContextGetPayload>,
	): z.infer<typeof zDmDiscussionEventReturn> {
		const {
			chanInvitationDmDiscussionEvent,
			classicDmDiscussionEvent,
			blockedDmDiscussionEvent,
		} = event

		if (chanInvitationDmDiscussionEvent) {
			return {
				...element,
				type: "event",
				eventType: "CHAN_INVITATION",
				author: chanInvitationDmDiscussionEvent.chanInvitation.invitingUserName,
				chanTitle: chanInvitationDmDiscussionEvent.chanInvitation.chanTitle,
			}
		} else if (blockedDmDiscussionEvent) {
			return {
				...element,
				type: "event",
				eventType: "BLOCKED",
				...blockedDmDiscussionEvent,
			}
		} else {
			return {
				...element,
				type: "event",
				eventType: classicDmDiscussionEvent.eventType,
				otherName:
					username === dm.requestedUserName
						? dm.requestingUserName
						: dm.requestedUserName,
			}
		}
	}

	private formatDmMessage(
		element: Omit<
			Prisma.DmDiscussionElementGetPayload<typeof this.dmDiscussionElementGetPayload>,
			"message" | "event"
		>,
		message:
			| (Prisma.DmDiscussionMessageGetPayload<typeof this.dmDiscussionMessageGetPayload> & {
					isDeleted: false
			  })
			| (Extract<
					RetypedEvent<
						Prisma.DmDiscussionEventGetPayload<typeof this.dmDiscussionEventGetPayload>
					>,
					{ deletedMessageDmDiscussionEvent: {} }
			  > & { isDeleted: true }),
	): z.infer<typeof zDmDiscussionMessageReturn> {
		if (!message.isDeleted) {
			const { isDeleted, ...rest } = message
			return {
				...element,
				...rest,
				type: "message",
				hasBeenEdited:
					element.creationDate.getTime() !== message.modificationDate.getTime(),
				isDeleted: false,
			}
		}
		const { deletedMessageDmDiscussionEvent, isDeleted } = message
		return {
			...element,
			...deletedMessageDmDiscussionEvent,
			isDeleted,
			type: "message",
			content: "",
		}
	}

	private async formatDmElementForUser(
		element: Prisma.DmDiscussionElementGetPayload<typeof this.dmDiscussionElementGetPayload>,
		username: string,
	): Promise<z.infer<typeof zDmDiscussionElementReturn>> {
		const { event, message, ...rest } = element as RetypedElement<typeof element>
		if (event) {
			const retypedEvent = event as RetypedEvent<typeof event>
			if (retypedEvent.deletedMessageDmDiscussionEvent)
				return this.formatDmMessage(rest, { ...retypedEvent, isDeleted: true })
			const dm = await this.getDmOrThrow(
				{ elements: { some: { id: element.id } } },
				this.directMessageContextSelect,
			)
			return this.formatDmEventForUser(rest, retypedEvent, username, dm)
		}
		return this.formatDmMessage(rest, { ...message, isDeleted: false })
	}

	private async formatDmElementArray(
		elements: Prisma.DmDiscussionElementGetPayload<typeof this.dmDiscussionElementGetPayload>[],
		username: string,
	): Promise<z.infer<typeof zDmDiscussionElementReturn>[]> {
		return Promise.all(elements.map((el) => this.formatDmElementForUser(el, username)))
	}

	public async findDmBetweenUsers<T extends Prisma.DirectMessageSelect>(
		usernameA: string,
		usernameB: string,
		select: Prisma.Subset<T, Prisma.DirectMessageSelect>,
	) {
		//findFirst instead of findUnique because there is no way to express in
		// a prisma schema than a relation is unique in both ways/direction
		return this.prisma.directMessage.findFirst({
			where: {
				OR: [
					{
						requestedUserName: usernameA,
						requestingUserName: usernameB,
					},
					{
						requestingUserName: usernameA,
						requestedUserName: usernameB,
					},
				],
			},
			select: select,
		})
	}

	private getDmDiscussionEventCreateArgs(dmId: string) {
		const args = {
			data: {
				discussionElement: {
					create: {
						directMessage: { connect: { id: dmId } },
					},
				},
			},
			select: { discussionElement: { select: this.dmDiscussionElementSelect } },
		} satisfies Prisma.DmDiscussionEventCreateArgs
		return args
	}

	public async searchDms(username: string, take: number, contains: string) {
		return (
			await this.prisma.directMessage.findMany({
				where: {
					OR: [
						{
							requestingUserName: username,
							requestedUserName: { contains },
						},
						{
							requestedUserName: username,
							requestingUserName: { contains },
						},
					],
				},
				take,
				select: { id: true, requestingUserName: true, requestedUserName: true },
			})
		).map((dm) => ({
			dmId: dm.id,
			otherUserName:
				username === dm.requestedUserName ? dm.requestingUserName : dm.requestedUserName,
		}))
	}

	public async createClassicDmEvent(
		dmId: string,
		eventType: (typeof ClassicDmEventType)[keyof typeof ClassicDmEventType],
	) {
		const { data, ...rest } = this.getDmDiscussionEventCreateArgs(dmId)
		const createArgs = {
			...rest,
			data: { classicDmDiscussionEvent: { create: { eventType: eventType } }, ...data },
		} satisfies Prisma.DmDiscussionEventCreateArgs
		const newEvent = (await this.prisma.dmDiscussionEvent.create(createArgs)).discussionElement
		if (!newEvent?.event?.classicDmDiscussionEvent)
			throw new InternalServerErrorException("a discussion event has failed to be created")
		return newEvent
	}

	public async createChanInvitationDmEvent(
		dmId: string,
		chanId: string,
		prismaInstance: Tx = this.prisma,
	) {
		const { data, ...rest } = this.getDmDiscussionEventCreateArgs(dmId)
		const createArgs = {
			...rest,
			data: {
				chanInvitationDmDiscussionEvent: { create: { chanInvitationId: chanId } },
				...data,
			},
		} satisfies Prisma.DmDiscussionEventCreateArgs
		const newEvent = (await prismaInstance.dmDiscussionEvent.create(createArgs))
			.discussionElement
		if (!newEvent?.event?.chanInvitationDmDiscussionEvent)
			throw new InternalServerErrorException("a discussion event has failed to be created")
		return newEvent
	}

	public async findOneDmElement(
		dmElementId: string,
		prismaInstance: Tx = this.prisma,
		username: string,
	) {
		const dmDiscussionElement = await prismaInstance.dmDiscussionElement.findUnique({
			where: { id: dmElementId },
			select: this.dmDiscussionElementSelect,
		})
		if (!dmDiscussionElement)
			throw new NotFoundException(`not found DmDiscussionElement ${dmElementId}`)
		return this.formatDmElementForUser(dmDiscussionElement, username)
	}

	public async createAndNotifyDm(requestingUserName: string, requestedUserName: string) {
		const newDm = await this.prisma.directMessage.create({
			data: {
				requestingUserName: requestingUserName,
				requestedUserName: requestedUserName,
			},
			select: this.getDirectMessageSelect(requestingUserName),
		})
		await this.sse.pushEvent(requestingUserName, {
			type: "CREATED_DM",
			data: this.formatDirectMessage(newDm, requestingUserName),
		})
		await this.sse.pushEvent(requestedUserName, {
			type: "CREATED_DM",
			data: this.formatDirectMessage(newDm, requestedUserName),
		})
		return newDm.id
	}

	public async updateAndNotifyDmStatus(
		dmId: string,
		newStatus: (typeof DirectMessageStatus)[keyof typeof DirectMessageStatus],
		username: string,
	) {
		const { requestingUserName, requestedUserName } = await this.prisma.directMessage.update({
			where: { id: dmId },
			data: {
				status: newStatus,
			},
			select: { requestedUserName: true, requestingUserName: true },
		})
		await this.sse.pushEventMultipleUser([requestingUserName, requestedUserName], {
			type: "UPDATED_DM_STATUS",
			data: { dmId, status: newStatus },
		})
	}

	async getDms(username: string) {
		return this.formatDirectMessageArray(
			await this.prisma.directMessage.findMany({
				where: {
					OR: [{ requestedUserName: username }, { requestingUserName: username }],
				},
				select: this.getDirectMessageSelect(username),
				orderBy: { modificationDate: "desc" },
			}),
			username,
		)
	}

	private async getDmOfUserOrThrow<T extends Prisma.DirectMessageSelect>(
		username: string,
		dmId: string,
		select: Prisma.SelectSubset<T, Prisma.DirectMessageSelect>,
	) {
		return this.getDmOrThrow(
			{
				id: dmId,
				OR: [{ requestedUserName: username }, { requestingUserName: username }],
			},
			select,
		)
	}

	private async getDmOrThrow<T extends Prisma.DirectMessageSelect>(
		where: Prisma.DirectMessageWhereInput,
		select: Prisma.SelectSubset<T, Prisma.DirectMessageSelect>,
	) {
		const res = await this.prisma.directMessage.findFirst({ where, select })
		if (!res) throw new NotFoundException(`not found dm where ${JSON.stringify(where)}`)
		return res
	}

	private async getDmElementOrThrow<Sel extends Prisma.DmDiscussionElementSelect>(
		username: string,
		select: Prisma.Subset<Sel, Prisma.DmDiscussionElementSelect>,
		where: Prisma.DmDiscussionElementWhereUniqueInput,
	) {
		const element = await this.prisma.dmDiscussionElement.findUnique({
			where: {
				...where,
				directMessage: {
					OR: [{ requestedUserName: username }, { requestingUserName: username }],
				},
			},
			select: select,
		})
		if (!element) throw new NotFoundException(`not found msg where {${where}}`)
		return element
	}

	async getDmElements(username: string, dmId: string, nElements: number, start?: string) {
		const res = await this.getDmOfUserOrThrow(username, dmId, {
			elements: {
				cursor: start ? { id: start } : undefined,
				orderBy: { creationDate: "desc" },
				take: nElements,
				select: this.dmDiscussionElementSelect,
				skip: Number(!!start),
			},
		})
		return this.formatDmElementArray(res.elements.reverse(), username)
	}

	async getDmElementById(username: string, dmId: string, elementId: string) {
		return this.formatDmElementForUser(
			await this.getDmElementOrThrow(username, this.dmDiscussionElementSelect, {
				id: elementId,
				directMessageId: dmId,
			}),
			username,
		)
	}

	async createDmMessage(username: string, dmId: string, content: string, relatedId?: string) {
		const toCheck = await this.getDmOfUserOrThrow(username, dmId, {
			elements: relatedId !== undefined && {
				where: { id: relatedId },
				select: { id: true },
				take: 1,
			},
			status: true,
		})
		if (relatedId !== undefined && !toCheck.elements?.length)
			throw new NotFoundException(`not found element ${relatedId} in directMessage ${dmId}`)
		if (toCheck.status === DirectMessageStatus.DISABLED)
			throw new ForbiddenException(`DISABLED DirectMessage`)
		const res = (
			await this.prisma.dmDiscussionMessage.create({
				data: {
					authorRelation: { connect: { name: username } },
					content: content,
					related:
						relatedId !== undefined
							? {
									connect: { id: relatedId },
							  }
							: undefined,
					discussionElement: {
						create: {
							directMessageId: dmId,
						},
					},
				},
				select: {
					discussionElement: { select: this.dmDiscussionElementSelect },
				},
			})
		).discussionElement
		if (!res || !res.message || res.event)
			throw new InternalServerErrorException("discussion element creation failed")
		const { message, ...rest } = res
		const formattedRes = this.formatDmMessage(rest, { ...message, isDeleted: false })
		await this.notifyOtherMemberOfDm(username, dmId, {
			type: "CREATED_DM_ELEMENT",
			data: { dmId: dmId, element: formattedRes },
		})
		return formattedRes
	}

	async updateMessage(username: string, dmId: string, elementId: string, content: string) {
		const element = await this.getDmElementOrThrow(
			username,
			{ message: { select: { author: true } } },
			{ id: elementId, directMessageId: dmId },
		)
		if (!element.message) throw new ForbiddenException("event can't be updated")
		if (element.message.author !== username) throw new ForbiddenException("not owned message")
		const updatedElement = await this.prisma.dmDiscussionElement.update({
			where: { id: elementId },
			data: { message: { update: { content: content } } },
			select: this.dmDiscussionElementSelect,
		})
		if (!updatedElement.message || updatedElement.event)
			throw new InternalServerErrorException("discussion element update failed")
		const { message, ...rest } = updatedElement
		const formattedUpdatedElement = this.formatDmMessage(rest, { ...message, isDeleted: false })
		await this.notifyOtherMemberOfDm(username, dmId, {
			type: "UPDATED_DM_MESSAGE",
			data: { dmId: dmId, message: formattedUpdatedElement },
		})
		return formattedUpdatedElement
	}

	// a bit dirty
	async deleteDmMessage(username: string, dmId: string, elementId: string) {
		const { message } = await this.getDmElementOrThrow(
			username,
			{ message: { select: { author: true, id: true } } },
			{ id: elementId, directMessageId: dmId },
		)
		if (!message) throw new ForbiddenException("event can't be deleted")
		if (message.author !== username) throw new ForbiddenException("not owned message")
		await this.prisma.dmDiscussionElement.update({
			where: { id: elementId },
			data: {
				event: {
					create: {
						deletedMessageDmDiscussionEvent: {
							create: { author: username },
						},
					},
				},
			},
		})
		const res = await this.prisma.dmDiscussionElement.update({
			where: { id: elementId },
			data: {
				message: { delete: { id: message.id } },
			},
			select: this.dmDiscussionElementSelect,
		})
		if (!res.event || !res.event.deletedMessageDmDiscussionEvent || res.message)
			throw new InternalServerErrorException("discussion element update failed")
		const { event, ...rest } = res
		const retypedEvent = event as Extract<
			RetypedEvent<typeof event>,
			{ deletedMessageDmDiscussionEvent: {} }
		>
		const formattedRes = this.formatDmMessage(rest, { ...retypedEvent, isDeleted: true })
		await this.notifyOtherMemberOfDm(username, dmId, {
			type: "UPDATED_DM_MESSAGE",
			data: { dmId: dmId, message: formattedRes },
		})
		return formattedRes
	}

	async formatAndNotifyDmElement(
		usernameA: string,
		usernameB: string,
		dmId: string,
		element: Prisma.DmDiscussionElementGetPayload<typeof this.dmDiscussionElementGetPayload>,
	) {
		return Promise.all([
			this.sse.pushEvent(usernameA, {
				type: "CREATED_DM_ELEMENT",
				data: { dmId, element: await this.formatDmElementForUser(element, usernameA) },
			}),
			this.sse.pushEvent(usernameB, {
				type: "CREATED_DM_ELEMENT",
				data: { dmId, element: await this.formatDmElementForUser(element, usernameB) },
			}),
		])
	}

	async notifyOtherMemberOfDm(username: string, dmId: string, event: DmEvent) {
		const { requestedUserName, requestingUserName } = await this.getDmOfUserOrThrow(
			username,
			dmId,
			{
				requestingUserName: true,
				requestedUserName: true,
			},
		)
		return this.sse.pushEvent(
			requestedUserName !== username ? requestedUserName : requestingUserName,
			event,
		)
	}
}
