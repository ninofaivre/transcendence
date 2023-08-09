import { Injectable } from "@nestjs/common"
import { z } from "zod"

require("dotenv").config()

const envSchema = z.object({
	PGPASSWORD: z.string().nonempty(),
	DATABASE_URL: z.string().url(),
	PUBLIC_BACKEND_PORT: z.coerce.number().min(1024).max(49151),
})

@Injectable()
export class EnvService {
	public static env = envSchema.parse(process.env)
}
