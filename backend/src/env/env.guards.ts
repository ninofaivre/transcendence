import { CanActivate } from "@nestjs/common";
import { EnvService } from "./env.service";
import { contractErrors } from "contract";
import { getHttpExceptionFromContractError } from "../utils";

// TODO after BH: do correct typing instead of unknown like error.ts
export class EnvGuard implements CanActivate {

    private readonly keyValues: [keyof typeof EnvService.env, unknown][];

    constructor(
        private readonly type: 'every' | 'some',
        ...args: [keyof typeof EnvService.env, unknown][]
    ) {
        this.keyValues = args
    }

    canActivate(): boolean {
        if (this.type === 'every') {
            if (this.keyValues.every(([key, value]) => EnvService.env[key] === value))
                return true
            const condition = this.keyValues.map(([key, value]) => `${key} == ${value}`).join(' AND ')
            throw getHttpExceptionFromContractError(contractErrors.ForbiddenByEnv(condition))
        }
        if (this.type === 'some') {
            if (this.keyValues.some(([key, value]) => EnvService.env[key] === value))
                return true
            const condition = this.keyValues.map(([key, value]) => `${key} == ${value}`).join(' OR ')
            throw getHttpExceptionFromContractError(contractErrors.ForbiddenByEnv(condition))
        }
        return true
    }
}

export const DevGuard = new EnvGuard('every', ['PUBLIC_MODE', 'DEV'])
