import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { UseGuards, Request } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@WebSocketGateway()
export class TestWebsocketGateway
{
	@SubscribeMessage('message')
	handleMessage(@Request()req: any, client: any, payload: any): string
	{
		console.log("req :", req.user.username)
		// console.log(client, payload)
		return 'Hello world!';
	}
}
