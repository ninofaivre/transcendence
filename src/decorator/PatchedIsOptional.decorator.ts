import { ValidationOptions, ValidateIf } from 'class-validator';

export function IsOptionalNotNullable( validationOptions?: ValidationOptions,)
{
	return ValidateIf((ob: any, v: any) =>
		{
			return v !== undefined;
		}, validationOptions);
}
