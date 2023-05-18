import { Module, forwardRef } from '@nestjs/common';
import { ChansService } from './chans.service';
import { ChansController } from './chans.controller';
import { AppService } from 'src/app.service';
import { PermissionsService } from './permissions/permissions.service';
import { SseModule } from 'src/sse/sse.module';
import { CaslModule } from 'src/casl/casl.module';

@Module({
  providers: [ChansService, AppService, PermissionsService],
  controllers: [ChansController],
  imports: [SseModule, CaslModule],
  exports: [PermissionsService, ChansService]
})
export class ChansModule {}
