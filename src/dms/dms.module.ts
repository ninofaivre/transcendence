import { Module } from '@nestjs/common';
import { DmsService } from './dms.service';
import { DmsController } from './dms.controller';
import { AppService } from 'src/app.service';

@Module({
	providers: [DmsService, AppService],
	controllers: [DmsController]
})
export class DmsModule {}
