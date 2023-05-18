import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CaslAbilityFactory } from "./casl-ability.factory/casl-ability.factory";
import { Observable } from "rxjs";
import { CHECK_ABILITY, RequiredRule } from "./abilities.decorator";
import { TsRestRequest } from "@ts-rest/nest";

@Injectable()
export class AbilitiesGuard implements CanActivate
{
	constructor(private reflector: Reflector,
			    private caslAbilityFactory: CaslAbilityFactory) {}

	async canActivate(context: ExecutionContext): Promise<boolean>
	{
	    const rules = this.reflector.get<RequiredRule[]>(CHECK_ABILITY, context.getHandler())
		return true
	}
}
