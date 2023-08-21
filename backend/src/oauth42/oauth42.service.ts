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

    private async getToken(code: string, redirect_uri: string): Promise<string | undefined> {
        try {
            return (await firstValueFrom(
                this.httpService.post('https://api.intra.42.fr/oauth/token', {
                    grant_type: 'authorization_code',
                    client_id: EnvService.env.PUBLIC_API42_CLIENT_ID,
                    client_secret: EnvService.env.API42_CLIENT_SECRET,
                    code,
                    redirect_uri
                }))
            )?.data?.access_token
        } catch {}
    }

    public async getIntraUserName(code: string, redirect_uri_suffix: string): Promise<string | undefined> {
        const token = await this.getToken(code, redirect_uri_suffix)
        if (!token)
            return
        try {
            return (await firstValueFrom(
                this.httpService.get('https://api.intra.42.fr/v2/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
            ))?.data?.login
        } catch {}
    }

}
