import { createZodDto } from "@anatine/zod-nestjs"
import { z } from "zod"

const SearchChansQuerySchema =
z.object
({
	titleContains: z.string().nonempty(),
	nResult: z.coerce.number().positive().int().default(10)
}).strict()

export class SearchChansQueryDTO extends createZodDto(SearchChansQuerySchema) {}
