import { createZodDto } from "@anatine/zod-nestjs";
import { id } from "src/zod/id.zod";
import { z } from "zod";

const DeleteFriendPathSchema =
z.object
({
	friendShipId: id
}).strict()

export class DeleteFriendPathDTO extends createZodDto(DeleteFriendPathSchema) {}
