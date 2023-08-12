import { Injectable } from '@nestjs/common';
import { z } from 'zod';

require("dotenv").config()

const zPassword = z.string().min(8)

const envSchema = z.object({
    JWT_SECRET: zPassword,
    PROFILE_PICTURE_DIR: z.string(),
    DATABASE_URL: z.string().url(),
    PUBLIC_BACKEND_PORT: z.coerce.number().min(1024).max(49151)
})

@Injectable()
export class EnvService
{
    public static env = envSchema.parse(process.env)
}
