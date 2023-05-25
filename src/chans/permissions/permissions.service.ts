import { Injectable } from '@nestjs/common';
import { PermissionList, Prisma, RoleApplyingType } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class PermissionsService
{
	//
	// constructor(private readonly prisma: PrismaService) {}
	//
	//
	// async doesUserHasRightTo(requiringUsername: string, requiredUsername: string, perm: PermissionList, chanId: number): Promise<boolean>
	// {
	// 	return !!(await this.prisma.chan.findUnique({
	// 		where:
	// 		{
	// 			id: chanId,
	// 			OR:
	// 			[
	// 				{ ownerName: requiringUsername },
	// 				{
	// 					roles:
	// 					{
	// 						some: this.getRolesDoesUserHasRighTo(requiringUsername, requiredUsername, perm)
	// 					},
	// 					ownerName: { not: requiredUsername }
	// 				},
	// 			]
	// 		},
	// 		select: { id: true }}))
	// }
	//
	// getRolesDoesUserHasRighTo(requiringUsername: string, requiredUsername: string, perm: PermissionList): Prisma.RoleWhereInput
	// {
	// 	return ((requiringUsername === requiredUsername) ?
	// 		{
	// 			permissions: { has: perm },
	// 			users: { some: { name: requiringUsername } },
	// 		}:
	// 		{
	// 			permissions: { has: perm },
	// 			OR:
	// 			[
	// 				{
	// 					roleApplyOn: RoleApplyingType.ROLES,
	// 					users:
	// 					{
	// 						some: { name: requiringUsername },
	// 						none: { name: requiredUsername }
	// 					},
	// 					roles:
	// 					{
	// 						some: { users: { some: { name: requiredUsername } } }
	// 					}
	// 				},
	// 				{
	// 					roleApplyOn: RoleApplyingType.ROLES_AND_SELF,
	// 					users: { some: { name: requiringUsername } },
	// 					OR:
	// 					[
	// 						{ users: { some: { name: requiredUsername } } },
	// 						{
	// 							roles:
	// 							{
	// 								some: { users: { some: { name: requiredUsername } } }
	// 							}
	// 						}
	// 					]
	// 				}
	// 			]
	// 		})
	// }
	//
}
