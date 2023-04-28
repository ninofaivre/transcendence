import { createZodDto } from "@anatine/zod-nestjs";
import { id } from "src/zod/id.zod";
import { z } from "zod";

const GetChanMessagesPathSchema =
z.object
({
	chanId: id
}).strict()

export class GetChanMessagesPathDTO extends createZodDto(GetChanMessagesPathSchema) {}
