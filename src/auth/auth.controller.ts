import { Controller, Res, Request, Body, Get, Post, UseGuards, Sse, MessageEvent, ValidationPipe } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard'
import { AuthService } from './auth.service'
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {}


	@UseGuards(LocalAuthGuard)
	@Post('/login')
	async login(@Res({ passthrough: true }) res: any, @Request() req: any)
	{
		res.cookie('access_token', await this.authService.login(req.user),
			{
				secure: true,
				sameSite: true,
			})
	}

    @Get('/logout')
    async logout(@Res({ passthrough: true }) res: any)
	{
        res.cookie('access_token', '', { expires: new Date(0) })
    }

}
