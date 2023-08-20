import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios'
import { EnvService } from 'src/env/env.service';

@Injectable()
export class Oauth42Service {

    constructor(
        private readonly httpService: HttpService
    ) {

    }

    private async getToken(code: string): Promise<string | undefined> {
        return (await firstValueFrom(
            this.httpService.post('https://api.intra.42.fr/oauth/token', {
                grant_type: 'authorization_code',
                client_id: EnvService.env.PUBLIC_API42_CLIENT_ID,
                client_secret: EnvService.env.API42_CLIENT_SECRET,
                code,
                redirect_uri: EnvService.env.PUBLIC_API42_REDIRECT_URI
            }))
        ).data.access_token
    }

    public async getIntraUserName(code: string): Promise<string | undefined> {
        const token = await this.getToken(code)
        if (!token)
            return
        return (await firstValueFrom(
            this.httpService.get('https://api.intra.42.fr/v2/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
        )).data.login
    }

}
