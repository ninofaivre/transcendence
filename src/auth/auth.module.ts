import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma.service'
import { LocalStrategy } from './local.strategy'
import { UsersModule } from '../users/users.module'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtStrategy } from './jwt.strategy'

@Module({
	imports:
	[
		PassportModule,
		ConfigModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) =>
			({
				secret: configService.get<string>('JWT_SECRET'),
				signOptions: { expiresIn: 3600 }
			}),
			inject: [ConfigService]
		}),
		UsersModule,
	],
	providers: [AuthService, PrismaService, LocalStrategy, JwtStrategy],
	controllers: [AuthController],
})

export class AuthModule {}
