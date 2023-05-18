import { ExecutionContext, SetMetadata, createParamDecorator } from "@nestjs/common";
import { subjects, Action, ChanAction } from "./casl-ability.factory/casl-ability.factory";

export const CHECK_ABILITY = 'check_ability'

export interface RequiredRule
{
	action: Action | ChanAction,
	subject: subjects,
	test?: any
}

export const CheckAbilities = (...requirements: RequiredRule[]) => SetMetadata(CHECK_ABILITY, requirements)
