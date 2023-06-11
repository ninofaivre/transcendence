import { Module } from "@nestjs/common"
import { DmsService } from "./dms.service"
import { DmsController } from "./dms.controller"
import { SseModule } from "src/sse/sse.module"

@Module({
	imports: [SseModule],
	providers: [DmsService /* , AppService */],
	controllers: [DmsController],
	exports: [DmsService],
})
export class DmsModule {}
