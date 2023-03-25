import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service'
import { compare } from 'bcrypt'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
    constructor(
        private usersService: UserService,
        private jwtService: JwtService
    ) { }

    async validateUser(username: string, pass: string) {
        const dbUser = await this.usersService.getUserByName(username)
        if (dbUser && await compare(pass, dbUser.password)) {
            const { password, ...result } = dbUser
            return result
        }
        return null
    }

    async login(user: any) {
        const payload = { username: user.name, sub: user.id }
        return this.jwtService.sign(payload)
    }
}
