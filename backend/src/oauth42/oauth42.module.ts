import { Module } from '@nestjs/common';
import { Oauth42Service } from './oauth42.service';

@Module({
  providers: [Oauth42Service]
})
export class Oauth42Module {}
