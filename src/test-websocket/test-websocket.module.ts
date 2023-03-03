import { Module } from '@nestjs/common';
import { TestWebsocketGateway } from './test-websocket.gateway';

@Module(
{
	providers: [TestWebsocketGateway]
})
export class TestWebsocketModule {}
