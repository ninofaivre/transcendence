import { z } from 'zod'
import { createZodDto } from '@anatine/zod-nestjs'
import { username } from 'src/zod/username.zod'

const CreateUserSchema = z.object
({
	name: username,
	password: z.string().min(8).max(150)
}).strict()

export class CreateUserDTO extends createZodDto(CreateUserSchema) {}
