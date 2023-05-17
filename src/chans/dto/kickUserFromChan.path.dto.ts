import { createZodDto } from "@anatine/zod-nestjs";
import { id } from "src/zod/id.zod";
import { username } from "src/zod/username.zod";
import { z } from "zod";

const KickUserFromChanPathSchema =
z.object
({
	username: username,
	chanId: id
})

export class KickUserFromChanPathDTO extends createZodDto(KickUserFromChanPathSchema) {}
