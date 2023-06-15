import { Module, forwardRef } from "@nestjs/common"
import { SseService } from "./sse.service"
import { SseController } from "./sse.controller"
import { UserModule } from "src/user/user.module"

@Module({
    imports: [forwardRef(() => UserModule)],
	providers: [SseService],
	controllers: [SseController],
	exports: [SseService],
})
export class SseModule {}
