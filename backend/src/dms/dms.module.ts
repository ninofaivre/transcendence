import { Module, forwardRef } from "@nestjs/common"
import { DmsService } from "./dms.service"
import { DmsController } from "./dms.controller"
import { SseModule } from "src/sse/sse.module"
import { UserModule } from "src/user/user.module"

@Module({
	imports: [SseModule, forwardRef(() => UserModule)],
	providers: [DmsService],
	controllers: [DmsController],
	exports: [DmsService],
})
export class DmsModule {}
