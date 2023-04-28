import { Controller, ForbiddenException, Get, InternalServerErrorException, Request, Sse, UseGuards } from '@nestjs/common';
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
		const res = this.sseService.addSubject(req.user.username)?.subject
			.asObservable()
			.pipe(finalize(() => this.sseService.deleteSubject(req.user.username)))
		if (!res)
			throw new InternalServerErrorException(`failed to open sse`)
		return res
	}

}
