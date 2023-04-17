import { createZodDto } from "@anatine/zod-nestjs";
import { id } from "src/zod/id.zod";
import { z } from "zod";

const GetDmMessagesPathSchema =
z.object
({ 
	dmId: id 
}).strict()

export class GetDmMessagesPathDTO extends createZodDto(GetDmMessagesPathSchema) {}
