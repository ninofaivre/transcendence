import { Module } from '@nestjs/common';
import { ChansService } from './chans.service';
import { ChansController } from './chans.controller';
import { AppService } from 'src/app.service';
import { PermissionsService } from './permissions/permissions.service';
import { SseModule } from 'src/sse/sse.module';

@Module({
  providers: [ChansService, AppService, PermissionsService],
  controllers: [ChansController],
  exports: [PermissionsService],
  imports: [SseModule]
})
export class ChansModule {}
