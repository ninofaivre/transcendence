import { CanActivate } from "@nestjs/common";
import { EnvService } from "./env.service";
import { contractErrors } from "contract";
import { getHttpExceptionFromContractError } from "../utils";

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

export const DevGuard = new EnvGuard('PUBLIC_MODE', 'DEV')
