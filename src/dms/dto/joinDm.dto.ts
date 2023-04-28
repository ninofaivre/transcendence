import { createZodDto } from "@anatine/zod-nestjs";
import { IsId } from "src/decorator/isId.decorator";
import { id } from "src/zod/id.zod";
import { z } from "zod";

const JoinDmSchema =
z.object
({
	dmId: id
})

export class JoinDmDTO extends createZodDto(JoinDmSchema) {}
