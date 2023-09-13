import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';

require("dotenv").config()

const zPassword = z.string().min(8)
const zScheme = z.enum(["http", "https"])

const envSchema = z.object({
    PUBLIC_MODE: z.enum(["DEV", "PROD"]).default("PROD"),
    PUBLIC_DEV_LOGIN: z.coerce.boolean().default(false),
    JWT_SECRET: zPassword,
    PROFILE_PICTURE_DIR: z.string(),
    PUBLIC_PROFILE_PICTURE_MAX_SIZE_MB: z.coerce.number().min(0.5).max(50).default(8),
    API42_CLIENT_SECRET: z.string(),

    PUBLIC_BACKEND_SCHEME: zScheme,
    PUBLIC_FRONTEND_SCHEME: zScheme,
    PUBLIC_BACKEND_HOST: z.string(),
    PUBLIC_FRONTEND_HOST: z.string(),
    PUBLIC_FRONTEND_URL: z.string().url(),

    PRIVATE_BACKEND_PORT: z.coerce.number().min(1024).max(65535),

    PUBLIC_API42_CLIENT_ID: z.string(),
    APP_NAME: z.string()
})

@Injectable()
export class EnvService
{
    public static env = envSchema.parse(process.env)

    constructor() {
        if (EnvService.env.PUBLIC_MODE === 'DEV')
            Logger.warn('DEV MODE')
    }
}
