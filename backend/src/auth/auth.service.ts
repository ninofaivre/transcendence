import { Injectable } from "@nestjs/common"
import { UserService } from "../user/user.service"
import { compare } from "bcrypt"
import { JwtService } from "@nestjs/jwt"
import type { Request } from "express"

export type EnrichedRequest = Request & { user: { username: string } }

@Injectable()
export class AuthService {
	constructor(private usersService: UserService, private jwtService: JwtService) {}

	async validateUser(username: string, pass: string) {
		const dbUser = await this.usersService.getUserByName(username, {
			name: true,
			password: true,
		})
		if (dbUser && dbUser.password && dbUser.name && (await compare(pass, dbUser.password))) {
			const { password, ...result } = dbUser
			return { ...result, id: username }
		}
		return null
	}

	async login(user: any) {
		const payload = { username: user.name, sub: user.id }
		return this.jwtService.sign(payload)
	}
}
