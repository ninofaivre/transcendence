import { Injectable } from "@nestjs/common"
import { UserService } from "../user/user.service"
import { JwtService } from "@nestjs/jwt"
import { Request } from "express"
import { Oauth42Service } from "src/oauth42/oauth42.service"
import { PrismaService } from "src/prisma/prisma.service"
import { EnvService } from "src/env/env.service"
import * as bcrypt from "bcrypt"
import { contractErrors } from "contract"

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

    public async getTokens(user: EnrichedRequest['user']) {
        const payload = { ...user, sub: user.username }
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: EnvService.env.JWT_SECRET,
                expiresIn: '15m'
            }),
            this.jwtService.signAsync(payload, {
                // TODO mb use a different password for refresh and access tokens ?
                secret: EnvService.env.JWT_SECRET,
                expiresIn: '7d'
            })
        ])
        return { accessToken, refreshToken }
    }

	public async validateUser(code: string) {
        const intraUserName = await this.oAuth.getIntraUserName(code)
        if (!intraUserName)
            return contractErrors.Invalid42ApiCode(code)
        const user = await this.prisma.user.findUnique({ where: { intraUserName },
            select: { name: true }}) 
        if (!user)
            return contractErrors.NotRegisteredUser(intraUserName)
        return { username: user.name, intraUserName }
	}

    public async validateUserDev(username: string) {
        const user = await this.prisma.user.findUnique({ where: { name: username },
            select: { name: true, intraUserName: true } })
        if (!user)
            return null
        return { username, intraUserName: user.intraUserName }
    }

    public async updateRefreshToken(username: string, refreshToken: string) {
        return bcrypt.hash(refreshToken, 10)
            .then(hashedRefreshToken => this.prisma.user.update({
                where: { name: username },
                data: { refreshToken: hashedRefreshToken }
            }))
    }

    public async revokeRefreshToken(username: string) {
        return this.prisma.user.update({ where: { name: username },
            data: { refreshToken : null }})
    }

    public async doesRefreshTokenMatch(username: string, refreshToken: string) {
        const user = await this.usersService.getUserByName(username,
            { refreshToken: true, intraUserName: true })
        if (!user || !user.refreshToken)
            return null 
        const { intraUserName } = user
        return bcrypt.compareSync(refreshToken, user.refreshToken)
            ? { username, intraUserName }
            : null
    }

}
