import {
	Controller,
	InternalServerErrorException,
	Request,
	Sse,
	UseGuards,
} from "@nestjs/common"
import { finalize, Observable } from "rxjs"
import { JwtAuthGuard } from "src/auth/jwt-auth.guard"
import { MessageEvent } from "@nestjs/common"
import { SseService } from "./sse.service"

@Controller("/api/sse")
export class SseController {
	constructor(private readonly sseService: SseService) {}

	@UseGuards(JwtAuthGuard)
	@Sse("/")
	async sse(@Request() req: any): Promise<Observable<MessageEvent>> {
		const res = this.sseService
			.addSubject(req.user.username)
			.asObservable()
			.pipe(finalize(() => this.sseService.deleteSubject(req.user.username)))
		return res
	}
}
