import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { ClassicDmEventType, DirectMessageStatus, DmDiscussionEvent, Prisma } from "prisma-client"
import { SseService } from "src/sse/sse.service"
import { z } from "zod"
import {
	DmEvent,
	zDmDiscussionElementReturn,
	zDmReturn,
} from "contract"
import { Tx } from "src/types"
import { PrismaService } from "src/prisma/prisma.service"

@Injectable()
export class DmsService {
	constructor(
        private readonly prisma: PrismaService,
		private readonly sse: SseService,
	) {}

	private directMessageSelect = {
		id: true,
		requestedUserName: true,
		requestingUserName: true,
		creationDate: true,
		status: true,
	} satisfies Prisma.DirectMessageSelect

	private directMessageGetPayload = {
		select: this.directMessageSelect,
	} satisfies Prisma.DirectMessageArgs

	private dmDiscussionEventSelect = {
		classicDmDiscussionEvent: { select: { eventType: true } },
		chanInvitationDmDiscussionEvent: { select: { chanInvitation: { select: { invitingUserName: true, chanTitle: true } } } },
        deletedMessageDmDiscussionEvent: { select: { author: true } }
	} satisfies Prisma.DmDiscussionEventSelect

	private dmDiscussionEventGetPayload = {
		select: this.dmDiscussionEventSelect,
	} satisfies Prisma.DmDiscussionEventArgs

	private dmDiscussionMessageSelect = {
		content: true,
		relatedTo: true,
        author: true,
        modificationDate: true
	} satisfies Prisma.DmDiscussionMessageSelect

    private dmDiscussionMessageGetPayload = {
        select: this.dmDiscussionMessageSelect
    } satisfies Prisma.DmDiscussionMessageArgs

	private dmDiscussionElementSelect = {
		id: true,
		creationDate: true,
		message: { select: this.dmDiscussionMessageSelect },
		event: { select: this.dmDiscussionEventSelect },
	} satisfies Prisma.DmDiscussionElementSelect

	private dmDiscussionElementGetPayload = {
		select: this.dmDiscussionElementSelect,
	} satisfies Prisma.DmDiscussionElementArgs

	private formatDirectMessage(
		dm: Prisma.DirectMessageGetPayload<typeof this.directMessageGetPayload>,
		username: string,
	): z.infer<typeof zDmReturn> {
		const {
			requestedUserName,
			requestingUserName,
			...rest
		} = dm

		const requested: boolean = requestedUserName === username
		const formattedDirectMessage = {
			...rest,
			otherName: requested ? requestingUserName : requestedUserName,
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
        event: Prisma.DmDiscussionEventGetPayload<typeof this.dmDiscussionEventGetPayload>,
        username: string,
        dm: Prisma.DirectMessageGetPayload<typeof this.directMessageGetPayload>
    ) {
		type RetypedEvent =
			| (Omit<
					typeof event,
					"classicDmDiscussionEvent" | "chanInvitationDmDiscussionEvent" | "deletedMessageDmDiscussionEvent"
			  > & {
					classicDmDiscussionEvent: Exclude<typeof event.classicDmDiscussionEvent, null>
					chanInvitationDmDiscussionEvent: null,
                    deletedMessageDmDiscussionEvent: null
			  })
			| (Omit<
					typeof event,
					"classicDmDiscussionEvent" | "chanInvitationDmDiscussionEvent" | "deletedMessageDmDiscussionEvent"
			  > & {
					classicDmDiscussionEvent: null
					chanInvitationDmDiscussionEvent: Exclude<
						typeof event.chanInvitationDmDiscussionEvent,
						null
					>,
                    deletedMessageDmDiscussionEvent: null
			  })
            | (Omit<
                    typeof event,
                    "classicDmDiscussionEvent" | "chanInvitationDmDiscussionEvent" | "deletedMessageDmDiscussionEvent"
              > & {
                    classicDmDiscussionEvent: null,
                    chanInvitationDmDiscussionEvent: null,
                    deletedMessageDmDiscussionEvent: Exclude<typeof event.deletedMessageDmDiscussionEvent, null>
              })
		const retypedEvent = event as RetypedEvent

		const { chanInvitationDmDiscussionEvent, classicDmDiscussionEvent, deletedMessageDmDiscussionEvent } = retypedEvent

		if (chanInvitationDmDiscussionEvent) {
			return {
				eventType: "CHAN_INVITATION" as "CHAN_INVITATION",
                author: chanInvitationDmDiscussionEvent.chanInvitation.invitingUserName,
                chanTitle: chanInvitationDmDiscussionEvent.chanInvitation.chanTitle
			}
		} else if (deletedMessageDmDiscussionEvent)
            return {
                eventType: "DELETED_MESSAGE" as "DELETED_MESSAGE",
                author: deletedMessageDmDiscussionEvent.author
            }
        else {
            return {
                ...classicDmDiscussionEvent,
                otherName: (username === dm.requestedUserName) ? dm.requestingUserName : dm.requestedUserName
            }
        }
	}

    private formatDmMessage(message: Prisma.DmDiscussionMessageGetPayload<typeof this.dmDiscussionMessageGetPayload>) {
        const { modificationDate, ...rest } = message
        return { ...rest, hasBeenEdited: !!modificationDate }
    }

	private async formatDmElementForUser(
		element: Prisma.DmDiscussionElementGetPayload<typeof this.dmDiscussionElementGetPayload>,
        username: string
	): Promise<z.infer<typeof zDmDiscussionElementReturn>> {
		type RetypedElement =
			| (Omit<typeof element, "event" | "message"> & {
					event: null
					message: Exclude<typeof element.message, null>
			  })
			| (Omit<typeof element, "event" | "message"> & {
					event: Exclude<typeof element.event, null>
					message: null
			  })
		const { event, message, ...rest } = element as RetypedElement

		if (event) {
            const dm = await this.getDmOrThrow({ elements: { some: { id: element.id } } }, this.directMessageSelect)
            return {
                ...rest,
                type: "event",
                ...this.formatDmEventForUser(event, username, dm)
            }
        }
		else return { ...rest, type: "message", ...this.formatDmMessage(message) }
	}

	private async formatDmElementArray(
		elements: Prisma.DmDiscussionElementGetPayload<typeof this.dmDiscussionElementGetPayload>[],
        username: string
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

	private getDmDiscussionEventCreateArgs(dmId: string, author: string) {
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

	public async createClassicDmEvent(dmId: string, eventType: ClassicDmEventType, author: string) {
		const { data, ...rest } = this.getDmDiscussionEventCreateArgs(dmId, author)
		const createArgs = {
			...rest,
			data: { classicDmDiscussionEvent: { create: { eventType: eventType } }, ...data },
		} satisfies Prisma.DmDiscussionEventCreateArgs
		const newEvent = (await this.prisma.dmDiscussionEvent.create(createArgs)).discussionElement
		if (!newEvent?.event?.classicDmDiscussionEvent)
			throw new InternalServerErrorException("a discussion event has failed to be created")
		return this.formatDmElementForUser(newEvent, author)
	}

	public async createChanInvitationDmEvent(
		dmId: string,
		author: string,
		chanId: string,
		prismaInstance: Tx = this.prisma,
	) {
		const { data, ...rest } = this.getDmDiscussionEventCreateArgs(dmId, author)
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
		return this.formatDmElementForUser(newEvent, author)
	}

	public async findOneDmElement(dmElementId: string, prismaInstance: Tx = this.prisma, username: string) {
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
			select: this.directMessageSelect,
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
		newStatus: DirectMessageStatus,
		username: string,
	) {
		const updatedDm = await this.prisma.directMessage.update({
			where: { id: dmId },
			data: {
				status: newStatus,
			},
			select: this.directMessageSelect,
		})
		await Promise.all([
			this.sse.pushEvent(updatedDm.requestingUserName, {
				type: "UPDATED_DM",
				data: this.formatDirectMessage(updatedDm, updatedDm.requestingUserName),
			}),
			this.sse.pushEvent(updatedDm.requestedUserName, {
				type: "UPDATED_DM",
				data: this.formatDirectMessage(updatedDm, updatedDm.requestedUserName),
			}),
		])
		const newEvent = await this.createClassicDmEvent(
			dmId,
			newStatus === DirectMessageStatus.ENABLED
				? ClassicDmEventType.ENABLED_DM
				: ClassicDmEventType.DISABLED_DM,
			username,
		)
		await this.sse.pushEventMultipleUser(
			[updatedDm.requestedUserName, updatedDm.requestingUserName],
			{ type: "CREATED_DM_ELEMENT", data: { dmId, element: newEvent } },
		)
	}

	async getDms(username: string) {
		return this.formatDirectMessageArray(
			await this.prisma.directMessage.findMany({
				where: {
					OR: [{ requestedUserName: username }, { requestingUserName: username }],
				},
				select: this.directMessageSelect,
			}),
			username,
		)
	}

    private async getDmOfUserOrThrow<T extends Prisma.DirectMessageSelect>(
        username: string,
        dmId: string,
        select: Prisma.SelectSubset<T, Prisma.DirectMessageSelect>
    ) {
        return this.getDmOrThrow(
            {
                    id: dmId,
                    OR: [{ requestedUserName: username }, { requestingUserName: username }],
            }, select)
    }

	private async getDmOrThrow<T extends Prisma.DirectMessageSelect>(
        where: Prisma.DirectMessageWhereInput,
		select: Prisma.SelectSubset<T, Prisma.DirectMessageSelect>,
	) {
		const res = await this.prisma.directMessage.findFirst({where, select})
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
				directMessageId: dmId
			}),
            username
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
		if (!res) throw new InternalServerErrorException("discussion element creation failed")
		const formattedRes = await this.formatDmElementForUser(res, username)
		await this.notifyOtherMemberOfDm(username, dmId, {
			type: "CREATED_DM_ELEMENT",
			data: { dmId: dmId, element: formattedRes },
		})
		return formattedRes
	}

	async updateMessage(username: string, dmId: string, elementId: string, content: string) {
		const { message } = await this.getDmElementOrThrow(
			username,
			{ message: { select: { author: true } } },
			{ id: elementId, directMessageId: dmId },
		)
		if (!message) throw new ForbiddenException("event can't be updated")
		if (message.author !== username) throw new ForbiddenException("not owned message")
		const updatedElement = await this.formatDmElementForUser(
			await this.prisma.dmDiscussionElement.update({
				where: { id: elementId },
				data: { message: { update: { content: content } } },
				select: this.dmDiscussionElementSelect,
			}),
            username
		)
		await this.notifyOtherMemberOfDm(username, dmId, {
			type: "UPDATED_DM_ELEMENT",
			data: { dmId: dmId, element: updatedElement },
		})
		return updatedElement
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
		const formattedRes = await this.formatDmElementForUser({ ...res, message: null }, username)
		await this.notifyOtherMemberOfDm(username, dmId, {
			type: "UPDATED_DM_ELEMENT",
			data: { dmId: dmId, element: formattedRes },
		})
		return formattedRes
	}

	async notifyOtherMemberOfDm(username: string, dmId: string, event: DmEvent) {
		const { requestedUserName, requestingUserName } = await this.getDmOfUserOrThrow(username, dmId, {
			requestingUserName: true,
			requestedUserName: true,
		})
		return this.sse.pushEvent(
			requestedUserName !== username ? requestedUserName : requestingUserName,
			event,
		)
	}
}
