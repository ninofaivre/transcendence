import { Module } from '@nestjs/common';
import { ChansService } from './chans.service';
import { ChansController } from './chans.controller';
import { AppService } from 'src/app.service';
import { PermissionsService } from './permissions/permissions.service';
import { SseModule } from 'src/sse/sse.module';
import { CaslModule } from 'src/casl/casl.module';
// import { CaslModule } from 'nest-casl';
// import { permissions } from './chans.permissions'

@Module({
  providers: [ChansService, AppService, PermissionsService],
  controllers: [ChansController],
  exports: [PermissionsService],
  imports: [SseModule, CaslModule]
})
export class ChansModule {}
