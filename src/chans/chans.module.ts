import { Module } from '@nestjs/common';
import { ChansService } from './chans.service';
import { ChansController } from './chans.controller';
import { AppService } from 'src/app.service';

@Module({
  providers: [ChansService, AppService],
  controllers: [ChansController]
})
export class ChansModule {}
