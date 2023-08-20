import { Module } from '@nestjs/common';
import { Oauth42Service } from './oauth42.service';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [HttpModule],
    providers: [Oauth42Service],
    exports: [Oauth42Service]
})
export class Oauth42Module {}
