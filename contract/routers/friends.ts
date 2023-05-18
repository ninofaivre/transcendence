import { initContract } from "@ts-rest/core";
import { zDmId } from "../zod/dm.zod";
import { zFriendInvitationId } from "../zod/inv.zod";
import { zUserName } from "../zod/user.zod";
import { z } from "zod";

const c = initContract();

const subpath = "/api/friends";

const zFriendShipId = z.coerce.number().positive().int();

const zFriendShip = z.object({
  id: zFriendShipId,
  creationDate: z.date(),
  requestingUserName: zUserName,
  requestedUserName: zUserName,
  directMessage: z.object({ id: zDmId }).nullable(),
});

export const friendsContract = c.router({
  getFriends: {
    method: "GET",
    path: `${subpath}/`,
    responses: {
      200: z.array(zFriendShip),
    },
  },
  acceptFriendInvitation: {
    method: "POST",
    path: `${subpath}/`,
    body: z.strictObject({
      invitationId: zFriendInvitationId,
    }),
    responses: {
      201: zFriendShip,
    },
  },
  deleteFriend: {
    method: "DELETE",
    path: `${subpath}/:friendShipId`,
    pathParams: z.strictObject({
      friendShipId: zFriendShipId,
    }),
    body: c.body<null>(),
    responses: {
      202: c.response<null>(),
    },
  },
});
