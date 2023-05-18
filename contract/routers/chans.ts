import { extendApi } from "@anatine/zod-openapi";
import { ChanType, PermissionList, RoleApplyingType } from "@prisma/client";
import { initContract } from "@ts-rest/core";
import {
  zChanId,
  zChanPassword,
  zChanTitle,
  zCreatePrivateChan,
  zCreatePublicChan,
  zRoleName,
} from "../zod/chan.zod";
import { zDiscussionElementReturn, zMessageId } from "../zod/global.zod";
import { zUserName } from "../zod/user.zod";
import { z } from "zod";
import { unique } from "../zod/global.zod";

const c = initContract();

const subpath = "/api/chans";

const zRoleReturn = z.object({
  users: z.array(zUserName),
  roles: z.array(zRoleName),
  permissions: z.array(z.nativeEnum(PermissionList)),
  roleApplyOn: z.nativeEnum(RoleApplyingType),
  name: z.string(),
});

const zChanReturn = z.object({
  title: zChanTitle.nullable(),
  type: z.nativeEnum(ChanType),
  ownerName: z.string(),
  id: zChanId,
  users: z.array(z.string()).min(1),
  roles: z.array(zRoleReturn),
});

export const chansContract = c.router({
  searchChans: {
    method: "GET",
    path: `${subpath}/`,
    summary: "search for a chan",
    description: "only chan with type PUBLIC are searchable",
    query: z.strictObject({
      titleContains: zChanTitle,
      nResult: z.coerce.number().positive().int().max(30).default(10),
    }),
    responses: {
      200: z.array(
        z.object({
          passwordProtected: z.boolean(),
          nUsers: z.number().positive().int(),
          id: zChanId,
          title: zChanTitle,
        })
      ),
    },
  },
  getMyChans: {
    method: "GET",
    path: `${subpath}/me`,
    responses: {
      200: z.array(zChanReturn),
    },
  },
  leaveChan: {
    method: "DELETE",
    path: `${subpath}/me/:chanId`,
    summary: "leave a chan",
    pathParams: z.strictObject({
      chanId: zChanId,
    }),
    body: c.body<null>(),
    responses: {
      202: c.response<null>(),
    },
  },
  joinChanByInvitation: {
    method: "POST",
    path: `${subpath}/me/joinByInvitation`,
    body: z.strictObject({
      invitationId: z.number().positive().int(),
    }),
    responses: {
      200: zChanReturn,
    },
  },
  joinChanById: {
    method: "POST",
    path: `${subpath}/me/joinById`,
    body: z.strictObject({
      chanId: zChanId,
      password: zChanPassword,
    }),
    responses: {
      200: zChanReturn,
    },
  },
  createChan: {
    method: "POST",
    path: `${subpath}/`,
    summary: "create a chan",
    body: z.discriminatedUnion("type", [
      extendApi(zCreatePublicChan, {
        title: "PUBLIC",
      }),
      extendApi(zCreatePrivateChan, {
        title: "PRIVATE",
      }),
    ]),
    responses: {
      201: zChanReturn,
    },
  },
  updateChan: {
    method: "PATCH",
    path: `${subpath}/:chanId`,
    pathParams: z.strictObject({
      chanId: zChanId,
    }),
    body: z.discriminatedUnion("type", [
      z.strictObject({
        type: z.literal(ChanType.PUBLIC),
        title: zChanTitle.optional(),
        password: zChanPassword.nullable().optional(),
      }),
      z.strictObject({
        type: z.literal(ChanType.PRIVATE),
        title: zChanTitle.nullable().optional(),
      }),
      z.strictObject({
        type: z.undefined(),
        title: zChanTitle.nullable().optional(),
        password: zChanPassword.nullable().optional(),
      }),
    ]),
    responses: {
      204: zChanReturn,
    },
  },
  deleteChan: {
    method: "DELETE",
    path: `${subpath}/:chanId`,
    summary: "delete a chan",
    pathParams: z.strictObject({
      chanId: zChanId,
    }),
    body: c.body<null>(),
    responses: {
      202: c.response<null>(),
    },
  },
  createChanMessage: {
    method: "POST",
    path: `${subpath}/:chanId/messages`,
    summary: "post a message to a chan",
    pathParams: z.strictObject({
      chanId: zChanId,
    }),
    body: z.strictObject({
      content: z.string().nonempty().max(5000),
      relatedTo: z.number().positive().int().optional().describe("id of the related msg/event"),
      usersAt: unique(z.array(zUserName).nonempty()).optional(),
      rolesAt: unique(z.array(zRoleName).nonempty()).optional(),
    }),
    responses: {
      201: zDiscussionElementReturn, // .extend({ event: z.null() }) ==> Doable but a bit complex
    },
  },
  getChanMessages: {
    method: "GET",
    path: `${subpath}/:chanId/messages`,
    summary: "get messages by cursor in chan",
    pathParams: z.strictObject({
      chanId: zChanId,
    }),
    query: z.strictObject({
      nMessages: z.coerce.number().positive().int().max(50).default(25),
      cursor: zMessageId.optional(),
    }),
    responses: {
      200: z.array(zDiscussionElementReturn),
    },
  },
  deleteChanMessage: {
    method: "DELETE",
    path: `${subpath}/:chanId/messages/:messageId`,
    pathParams: z.strictObject({
      chanId: zChanId,
      messageId: zMessageId,
    }),
    body: c.body<null>(),
    responses: {
      202: c.response<null>(),
    },
  },
  kickUserFromChan: {
    method: "DELETE",
    path: `${subpath}/:chanId/:username`,
    pathParams: z.strictObject({
      chanId: zChanId,
      username: zUserName,
    }),
    body: c.body<null>(),
    responses: {
      202: c.response<null>(),
    },
  },
});
