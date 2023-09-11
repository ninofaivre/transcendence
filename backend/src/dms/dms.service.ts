import {
	ForbiddenException,
	Inject,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	forwardRef,
} from "@nestjs/common"
import { ClassicDmEventType, DirectMessageStatus, Prisma } from "@prisma/client"
import { SseService } from "src/sse/sse.service"
import { z } from "zod"
import { DmEvent, contractErrors, zDmDiscussionElementReturn, zDmReturn } from "contract"
import { ElementUnion, EventUnion, RetypedElement, RetypedEvent, Tx, AccessPolicyLevel, ProximityLevel, EnrichedRequest } from "src/types"
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
		// } satisfies Prisma.UserDefaultArgs
		return {
			requestedUser: {
				select: {
                    ...this.usersService.getProximityLevelSelect(username),
					name: true,
                    displayName: true,
					statusVisibilityLevel: true,
				},
			},
			requestingUser: {
				select: {
                    ...this.usersService.getProximityLevelSelect(username),
					name: true,
                    displayName: true,
					statusVisibilityLevel: true,
				},
			},
			...this.directMessageSelect,
		} satisfies Prisma.DirectMessageSelect
	}

	private directMessageContextSelect = {
		...this.directMessageSelect,
        requestingUser: { select: { displayName: true } },
		requestingUserName: true,
        requestedUser: { select: { displayName: true } },
		requestedUserName: true,
	} satisfies Prisma.DirectMessageSelect

	private directMessageContextGetPayload = {
		select: this.directMessageContextSelect,
	}

	private directMessageGetPayload = {
		select: this.getDirectMessageSelect("example"),
	} satisfies Prisma.DirectMessageDefaultArgs

	private dmDiscussionEventSelect = {
		classicDmDiscussionEvent: { select: { eventType: true } },
		chanInvitationDmDiscussionEvent: {
			select: {
                chanInvitation: {
                    select: {
                        invitingUserName: true,
                        invitingUser: {
                            select: { displayName: true }
                        },
                        chanTitle: true,
                        status: true,
                        id: true
                    }
                }
            },
		},
		deletedMessageDmDiscussionEvent: { select: { author: true, authorRelation: { select: { displayName: true } } } },
		blockedDmDiscussionEvent: { select: { blockedUserName: true, blockedUser: { select: { displayName: true } }, blockingUserName: true, blockingUser: { select: { displayName: true } } } },
	} satisfies Prisma.DmDiscussionEventSelect & Record<EventUnion, true | object>

	private dmDiscussionEventGetPayload = {
		select: this.dmDiscussionEventSelect,
	} satisfies Prisma.DmDiscussionEventDefaultArgs

	private dmDiscussionMessageSelect = {
		content: true,
		relatedTo: true,
		author: true,
        authorRelation: { select: { displayName: true } },
		modificationDate: true,
	} satisfies Prisma.DmDiscussionMessageSelect

	private dmDiscussionMessageGetPayload = {
		select: this.dmDiscussionMessageSelect,
	} satisfies Prisma.DmDiscussionMessageDefaultArgs

	private dmDiscussionElementSelect = {
		id: true,
		creationDate: true,
		message: { select: this.dmDiscussionMessageSelect },
		event: { select: this.dmDiscussionEventSelect },
	} satisfies Prisma.DmDiscussionElementSelect & Record<ElementUnion, true | object>

	private dmDiscussionElementGetPayload = {
		select: this.dmDiscussionElementSelect,
	} satisfies Prisma.DmDiscussionElementDefaultArgs

	public formatDirectMessage(
		dm: Prisma.DirectMessageGetPayload<typeof this.directMessageGetPayload>,
		username: string, //: z.infer<typeof zDmReturn> // BUG
	) {
		const { requestingUser, requestedUser, ...rest } = dm

		const other = username === requestedUser.name ? requestingUser : requestedUser

		const formattedDirectMessage: z.infer<typeof zDmReturn> = {
			...rest,
			otherName: other.name,
            otherDisplayName: other.displayName,
			otherStatus: this.usersService.getUserStatusByProximity(other.name,
				this.usersService.getProximityLevel(other),
				other.statusVisibilityLevel),
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
            const { chanInvitation: { invitingUser: { displayName: authorDisplayName } } } = chanInvitationDmDiscussionEvent
			return {
				...element,
				type: "event",
				eventType: "CHAN_INVITATION",
				author: chanInvitationDmDiscussionEvent.chanInvitation.invitingUserName,
                authorDisplayName,
				chanTitle: chanInvitationDmDiscussionEvent.chanInvitation.chanTitle,
                status: chanInvitationDmDiscussionEvent.chanInvitation.status
			}
		} else if (blockedDmDiscussionEvent) {
            const { blockedUser: { displayName: blockedDisplayName }, blockingUser: { displayName: blockingDisplayName }, ...rest } = blockedDmDiscussionEvent
			return {
				...element,
				type: "event",
				eventType: "BLOCKED",
                blockedDisplayName,
                blockingDisplayName,
				...rest,
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
                otherDisplayName:
                    username === dm.requestedUserName
                        ? dm.requestingUser.displayName
                        : dm.requestedUser.displayName
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
			const { isDeleted, authorRelation: { displayName: authorDisplayName }, ...rest } = message
			return {
				...element,
				...rest,
                authorDisplayName,
				type: "message",
				hasBeenEdited:
					element.creationDate.getTime() !== message.modificationDate.getTime(),
				isDeleted: false,
			}
		}
		const { deletedMessageDmDiscussionEvent: { author, authorRelation: { displayName: authorDisplayName } }, isDeleted } = message
		return {
			...element,
			author,
            authorDisplayName,
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
				directMessage: { connect: { id: dmId } },
			},
			select: {
                ...this.dmDiscussionElementSelect,
                directMessage: { select: { requestedUserName: true, requestingUserName: true } }
            }
		} satisfies Prisma.DmDiscussionElementCreateArgs
		return args
	}

	public async createAndNotifyClassicDmEvent(
		dmId: string,
		eventType: (typeof ClassicDmEventType)[keyof typeof ClassicDmEventType],
	) {
		const { data, ...rest } = this.getDmDiscussionEventCreateArgs(dmId)
		const createArgs = {
			...rest,
			data: {
                ...data,
                event:  {
                    create: {
                        classicDmDiscussionEvent: {
                            create: { eventType: eventType }
                        },
                    }
                }
            },
		} satisfies Prisma.DmDiscussionElementCreateArgs
        const res = await this.prisma.dmDiscussionElement.create(createArgs)
        const { directMessage: { requestedUserName, requestingUserName } } = res
        this.sse.pushEvent(requestedUserName, {
            type: 'CREATED_DM_ELEMENT',
            data: {
                dmId,
                element: await this.formatDmElementForUser(res, requestedUserName)
            }
        })
        this.sse.pushEvent(requestingUserName, {
            type: 'CREATED_DM_ELEMENT',
            data: {
                dmId,
                element: await this.formatDmElementForUser(res, requestingUserName)
            }
        })
	}

	public async createAndNotifyChanInvitationDmEvent(
		dmId: string,
		chanId: string
	) {
		const { data, ...rest } = this.getDmDiscussionEventCreateArgs(dmId)
		const createArgs = {
			...rest,
			data: {
				...data,
                event: {
                    create: {
				        chanInvitationDmDiscussionEvent: {
                            create: {
                                chanInvitationId: chanId
                            }
                        },
                    }
                }
			},
		} satisfies Prisma.DmDiscussionElementCreateArgs
		const res = (await this.prisma.dmDiscussionElement.create(createArgs))
        const { directMessage: { requestedUserName, requestingUserName } } = res
        this.sse.pushEvent(requestedUserName, {
            type: 'CREATED_DM_ELEMENT',
            data: {
                dmId,
                element: await this.formatDmElementForUser(res, requestedUserName)
            }
        })
        this.sse.pushEvent(requestingUserName, {
            type: 'CREATED_DM_ELEMENT',
            data: {
                dmId,
                element: await this.formatDmElementForUser(res, requestingUserName)
            }
        })
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

    public createDm = async(requestingUserName: string, requestedUserName: string) => this
		.prisma.directMessage.create({
			data: {
				requestingUserName: requestingUserName,
				requestedUserName: requestedUserName,
			},
			select: this.getDirectMessageSelect(requestingUserName),
		})

	public async createAndNotifyDm(requestingUserName: string, requestedUserName: string) {
        const newDm = await this.createDm(requestingUserName, requestedUserName)
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

    async createDmIfRightTo(username: string, otherUserName: string) {
        const res = await this.usersService.getUserByName(otherUserName, {
            dmPolicyLevel: true,
            directMessage: { where: { requestedUserName: username }, select: { id: true } },
            directMessageOf: { where: { requestingUserName: username }, select: { id: true } },
            ...this.usersService.getProximityLevelSelect(username)
        })
        if (!res) return contractErrors.NotFoundUser(otherUserName)
        if (res.directMessage.length || res.directMessageOf.length)
            return contractErrors.DmAlreadyExist(username, otherUserName)
        const { dmPolicyLevel } = res
        const proximity = this.usersService.getProximityLevel(res)
        if (proximity === "BLOCKED") {
            return res.blockedUser.length
                ? contractErrors.BlockedByUser(otherUserName, "createDm")
                : contractErrors.BlockedUser(username, "createDm")
        }
        if (ProximityLevel[proximity] < AccessPolicyLevel[dmPolicyLevel]) {
            return contractErrors.ProximityLevelTooLow(otherUserName,
                "createDm", proximity, dmPolicyLevel)
        }
        const newDm = await this.createDm(username, otherUserName)
        this.sse.pushEvent(otherUserName, {
            type: "CREATED_DM",
            data: this.formatDirectMessage(newDm, otherUserName)
        })
        return this.formatDirectMessage(newDm, username)
    }

	async createDmMessage(reqUser: EnrichedRequest['user'], dmId: string, content: string, relatedId?: string) {
        const { username } = reqUser
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
		const res = await this.prisma
            .dmDiscussionElement.create({
				data: {
                    directMessage: { connect: { id: dmId } },
                    message: {
                        create: {
                            authorRelation: { connect: { name: username } },
                            content: content,
                            related:
                                relatedId !== undefined
                                    ? {
                                            connect: { id: relatedId },
                                      }
                                    : undefined,
                        },
                    }
                },
				select: {
					...this.dmDiscussionElementSelect,
                    directMessage: {
                        select: {
                            requestedUserName: true,
                            requestingUserName: true
                        }
                    }
				},
			})
        const retypedRes = res as Extract<RetypedElement<typeof res>, { event: null }>
        const { message, ...rest } = retypedRes
		const formattedRes = this.formatDmMessage(rest, { ...message, isDeleted: false })
        const { directMessage: { requestedUserName, requestingUserName } } = res
		await this.sse.pushEventMultipleUser([requestedUserName, requestingUserName], {
			type: "CREATED_DM_ELEMENT",
			data: { dmId: dmId, element: formattedRes },
		}, reqUser)
		return formattedRes
	}

	async updateMessage(reqUser: EnrichedRequest['user'], dmId: string, elementId: string, content: string) {
        const { username } = reqUser
        const dm = await this.prisma.directMessage.findUnique({ where: { id: dmId },
            select: { status: true }})
        if (dm && dm.status === "DISABLED")
            throw new ForbiddenException(`dm ${dmId} is DISABLED`)
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
			select: {
                ...this.dmDiscussionElementSelect,
                directMessage: { select: { requestedUserName: true, requestingUserName: true } }
            },
		})
        const retypedUpdatedDmElement = updatedElement as Extract<RetypedElement<typeof updatedElement>, { event: null }>
		const { message, ...rest } = retypedUpdatedDmElement 
		const formattedUpdatedElement = this.formatDmMessage(rest, { ...message, isDeleted: false })
        const { directMessage: { requestedUserName, requestingUserName } } = updatedElement
        this.sse.pushEventMultipleUser([requestedUserName, requestingUserName], {
            type: 'UPDATED_DM_MESSAGE',
            data: { dmId, message: formattedUpdatedElement }
        }, reqUser)
		return formattedUpdatedElement
	}

	// a bit dirty
	async deleteDmMessage(reqUser: EnrichedRequest['user'], dmId: string, elementId: string) {
        const { username } = reqUser
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
			select: {
                ...this.dmDiscussionElementSelect,
                directMessage: { select: { requestingUserName: true, requestedUserName: true } }
            }
		})
        const retypedRes = res as Extract<RetypedElement<typeof res>, { event: {} }>
		const { event, ...rest } = retypedRes
		const retypedEvent = event as Extract<
			RetypedEvent<typeof event>,
			{ deletedMessageDmDiscussionEvent: {} }
		>
		const formattedRes = this.formatDmMessage(rest, { ...retypedEvent, isDeleted: true })
        const { directMessage: { requestingUserName, requestedUserName } } = res
        this.sse.pushEventMultipleUser([requestingUserName, requestedUserName], {
            type: 'UPDATED_DM_MESSAGE',
            data: { dmId, message: formattedRes }
        }, reqUser)
		return formattedRes
	}

}
