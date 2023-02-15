import { Controller, Request, Body, Get, Post, UseGuards, Sse, MessageEvent } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard'
import { JwtAuthGuard } from './jwt-auth.guard'
import { AuthService } from './auth.service'
//import { Observable, interval, map } from 'rxjs'

@Controller('auth')
export class AuthController
{
	constructor(private authService: AuthService) {}

	@UseGuards(LocalAuthGuard)
	@Post('/login')
	async login(@Request() req: any)
	{
		return this.authService.login(req.user)
	}

	/*
	msg: string = 'default'

	@Post('/sendMessage')
	async sendMessage(@Body() req: { message: string })
	{
		console.log('sendMessage contacted')
		console.log('new message registered: ' + req.message)
		this.msg = req.message
	}

	lol()
	{
		if (this.msg.length != 0)
		{
			const tmp = this.msg
			this.msg = ''
			return tmp
		}
		return this.msg
	}

	@Sse('sse')
	receiveMessage(): Observable<MessageEvent>
	{
		return interval(100).pipe(map((_) => ({ data: { msg: this.lol() } })))
	}
	*/
}
