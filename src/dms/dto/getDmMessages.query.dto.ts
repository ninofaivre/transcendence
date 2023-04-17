import { createZodDto } from "@anatine/zod-nestjs";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsPositive } from "class-validator";
import { IsId } from "src/decorator/isId.decorator";
import { id } from "src/zod/id.zod";
import { z } from "zod";

const GetDmMessagesQuerySchema =
z.object
({
	start: id.optional(),
	nMessages: z.coerce.number().positive().int().max(50).default(50)
}).strict()

export class GetDmMessagesQueryDTO extends createZodDto(GetDmMessagesQuerySchema) {}
