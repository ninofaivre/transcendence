import { z } from "zod";
import { username } from "src/zod/username.zod";
import { createZodDto } from "@anatine/zod-nestjs";

const OneUsernameSchema =
z.object
({
	username: username
})

export class OneUsernameDTO extends createZodDto(OneUsernameSchema) {}
