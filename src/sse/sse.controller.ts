import { Controller, Get, Request, Sse, UseGuards } from '@nestjs/common';
import { finalize, Observable } from 'rxjs';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { MessageEvent } from '@nestjs/common';
import { SseService } from './sse.service';

@Controller('sse')
export class SseController
{

	constructor(private readonly sseService: SseService) {}


	@UseGuards(JwtAuthGuard)
	@Sse('/')
	sse(@Request()req: any): Observable<MessageEvent>
	{
		console.log("open /sse for", req.user.username)
		this.sseService.addSubject(req.user.username)
		const res =  this.sseService.sendObservable(req.user.username)
			.pipe(finalize(() => this.sseService.deleteSubject(req.user.username)))
		return res
	}

}
