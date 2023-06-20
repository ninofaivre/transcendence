import { Prisma } from "prisma-client"
import { PrismaService } from "./prisma/prisma.service"

export type Tx = Omit<PrismaService, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">

//TODO: automation with union of string generic type
export type RetypedElement<T extends { message: any, event: any }> =
			| (Omit<T, "event" | "message"> & {
					event: null
					message: Exclude<T['message'], null>
			  })
			| (Omit<T, "event" | "message"> & {
					event: Exclude<T['event'], null>
					message: null
			  })

//TODO: automation with union of string generic type
export type RetypedEvent<T extends { classicDmDiscussionEvent: any, chanInvitationDmDiscussionEvent: any, deletedMessageDmDiscussionEvent: any, blockedDmDiscussionEvent: any }> =
			| (Omit<T, "classicDmDiscussionEvent" | "chanInvitationDmDiscussionEvent" | "deletedMessageDmDiscussionEvent" | "blockedDmDiscussionEvent"> & {
					classicDmDiscussionEvent: Exclude<T['classicDmDiscussionEvent'], null>
					chanInvitationDmDiscussionEvent: null,
                    deletedMessageDmDiscussionEvent: null,
                    blockedDmDiscussionEvent: null
			  })
			| (Omit<T, "classicDmDiscussionEvent" | "chanInvitationDmDiscussionEvent" | "deletedMessageDmDiscussionEvent" | "blockedDmDiscussionEvent"> & {
					classicDmDiscussionEvent: null
					chanInvitationDmDiscussionEvent: Exclude<T['chanInvitationDmDiscussionEvent'], null>,
                    deletedMessageDmDiscussionEvent: null,
                    blockedDmDiscussionEvent: null
			  })
            | (Omit<T, "classicDmDiscussionEvent" | "chanInvitationDmDiscussionEvent" | "deletedMessageDmDiscussionEvent" | "blockedDmDiscussionEvent"> & {
                    classicDmDiscussionEvent: null,
                    chanInvitationDmDiscussionEvent: null,
                    deletedMessageDmDiscussionEvent: Exclude<T['deletedMessageDmDiscussionEvent'], null>,
                    blockedDmDiscussionEvent: null
              })
            | (Omit<T, "classicDmDiscussionEvent" | "chanInvitationDmDiscussionEvent" | "deletedMessageDmDiscussionEvent" | "blockedDmDiscussionEvent"> & {
                    classicDmDiscussionEvent: null,
                    chanInvitationDmDiscussionEvent: null,
                    deletedMessageDmDiscussionEvent: null,
                    blockedDmDiscussionEvent: Exclude<T['blockedDmDiscussionEvent'], null>
              })

