import { createZodDto } from "@anatine/zod-nestjs";
import { id } from "src/zod/id.zod";
import { z } from "zod";

const CreateFriendSchema =
z.object
({
	invitationId: id
}).strict()

export class CreateFriendDTO extends createZodDto(CreateFriendSchema) {}
