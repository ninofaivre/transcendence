import { Controller, Request, Sse, UseGuards } from '@nestjs/common'
import { finalize, Observable } from 'rxjs'
import { AppService } from './app.service'
import { JwtAuthGuard } from './auth/jwt-auth.guard'
import { MessageEvent } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('global')
@Controller()
export class AppController
{
	constructor(private readonly appService: AppService) {}


	@UseGuards(JwtAuthGuard)
	@Sse('/sse')
	sse(@Request()req: any): Observable<MessageEvent>
	{
		console.log("open /sse for", req.user.username)
		this.appService.addSubject(req.user.username)
		return this.appService.sendObservable(req.user.username)
			.pipe(finalize(() => this.appService.deleteSubject(req.user.username)))
	}
}
