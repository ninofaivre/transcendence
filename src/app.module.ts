import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ServeStaticModule } from '@nestjs/serve-static'
import { AuthModule } from './auth/auth.module'
import { join } from 'path'
import { MessagesModule } from './messages/messages.module';

@Module({
	imports:
	[
		ServeStaticModule.forRoot(
		{
			//rootPath: join(__dirname, '..', 'client'),
			rootPath: join(__dirname, '..', 'frontend/build'),
			exclude: ['/api*'],
		}),
		AuthModule,
		MessagesModule
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
