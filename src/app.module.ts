import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ServeStaticModule } from '@nestjs/serve-static'
import { AuthModule } from './auth/auth.module'
import { join } from 'path'
import { MessagesModule } from './messages/messages.module';
import { TestWebsocketModule } from './test-websocket/test-websocket.module';

@Module({
	imports:
	[
		ServeStaticModule.forRoot(
		{
			rootPath: join(__dirname, '..', 'frontend/build'),
			exclude: ['/api*'],
		}),
		AuthModule,
		MessagesModule,
		TestWebsocketModule
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
