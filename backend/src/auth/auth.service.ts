import { Injectable } from "@nestjs/common"
import { UserService } from "../user/user.service"
import { JwtService } from "@nestjs/jwt"
import { Request } from "express"
import { Oauth42Service } from "src/oauth42/oauth42.service"
import { PrismaService } from "src/prisma/prisma.service"

export type EnrichedRequest = Request
    & {
        user: {
            username: string,
            intraUserName: string
        }
    }

@Injectable()
export class AuthService {
	constructor(
        private readonly prisma: PrismaService,
        private readonly usersService: UserService,
        private readonly jwtService: JwtService,
        private readonly oAuth: Oauth42Service
    ) {}

	async validateUser(code: string) {
        const intraUserName = await this.oAuth.getIntraUserName(code)
        if (!intraUserName)
            return null
        const user = await this.prisma.user.findUnique({ where: { intraUserName },
            select: { name: true }}) 
        if (!user)
            return null
        return { username: user.name, intraUserName }
	}

    async validateUserDev(username: string) {
        const user = await this.prisma.user.findUnique({ where: { name: username },
            select: { name: true, intraUserName: true } })
        if (!user)
            return null
        return { username, intraUserName: user.intraUserName }
    }

	async login(user: EnrichedRequest['user']) {
		const payload = { ...user, sub: user.username }
		return this.jwtService.sign(payload)
	}
}
