import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ServeStaticModule } from '@nestjs/serve-static'
import { AuthModule } from './auth/auth.module'
import { join } from 'path'
import { TestWebsocketModule } from './test-websocket/test-websocket.module';
import { ChatModule } from './chat/chat.module';
import { loggingMiddleware, PrismaModule } from 'nestjs-prisma'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ChansModule } from './chans/chans.module';
import { InvitationsModule } from './invitations/invitations.module';
import { DmsModule } from './dms/dms.module';
import { FriendsModule } from './friends/friends.module';
import { SseModule } from './sse/sse.module';

@Module({
	imports:
	[
		PrismaModule.forRootAsync({
			imports: [ ConfigModule ],
			inject: [ ConfigService ],
			isGlobal: true,
			useFactory: async (configService: ConfigService) =>
			({
				middlewares: [loggingMiddleware()],
				explicitConnect: true,
				prismaOptions :
				{
					datasources:
					{
						db: { url: configService.get('DATABASE_URL') }
					},
					log:
					[
						{
							emit: 'event',
							level: 'query',
						}
					],
				}
			}),
		}),
		ServeStaticModule.forRoot(
		{
			 rootPath: join(__dirname, '..', 'frontend/build'),
			//rootPath: join(__dirname, '..', 'client/build'),
			exclude: ['/api*'],
		}),
		AuthModule,
		TestWebsocketModule,
		ChatModule,
		ChansModule,
		InvitationsModule,
		DmsModule,
		FriendsModule,
		SseModule
	],
	controllers: [AppController],
	providers: [AppService],
	exports: [AppService]
})
export class AppModule {}
