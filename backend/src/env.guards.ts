import { CanActivate, HttpException } from "@nestjs/common";
import { EnvService } from "./env/env.service";
import { contractErrors } from "contract";
import { ContractErrorUnion } from "contract";

// TODO move this to an other place
const getHttpExceptionFromContractError = (error: ContractErrorUnion)  =>
    new HttpException(error.body, error.status)

export class EnvGuard<
    Key extends keyof typeof EnvService.env,
> implements CanActivate {

    constructor(
        private readonly key: Key,
        private readonly value: typeof EnvService.env[Key]
    ) {}

    canActivate(): boolean {
        if (!(EnvService.env[this.key] === this.value))
            throw getHttpExceptionFromContractError(contractErrors.ForbiddenByEnv(this.key, this.value))
        return true
    }
}

export const DevGuard = new EnvGuard('MODE', 'DEV')
