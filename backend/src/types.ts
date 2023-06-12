import { PrismaService } from "./prisma/prisma.service"

export type Tx = Omit<PrismaService, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">
