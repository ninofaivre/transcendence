import {
	Controller,
	InternalServerErrorException,
	Query,
	Request,
	Sse,
	UseGuards,
} from "@nestjs/common"
import { filter, finalize, Observable } from "rxjs"
import { JwtAuthGuard } from "src/auth/jwt-auth.guard"
import { MessageEvent } from "@nestjs/common"
import { SseService } from "./sse.service"
import { EnrichedRequest } from "src/types"

@Controller("/api/sse")
export class SseController {
	constructor(private readonly sseService: SseService) {}

	@UseGuards(JwtAuthGuard)
	@Sse("/")
	async sse(@Request() req: EnrichedRequest, @Query('sse-id')sseId: string | undefined): Promise<Observable<MessageEvent>> {
		return this.sseService
			.addSubject(req.user.username)
            .then(subject =>
                subject
                // .asObservable() TODO test if this shit works
                .pipe(filter(
                    (value: MessageEvent & { ignoreSseId?: string }) =>
                        (sseId && typeof sseId === "string")
                            ? value.ignoreSseId
                                ? value.ignoreSseId !== sseId
                                : true
                            : true)
                ).pipe(finalize(() => this.sseService.deleteSubject(req.user.username)))
            )
	}
}
