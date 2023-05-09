import { AbilityBuilder, PureAbility } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
import { Injectable } from '@nestjs/common';
import { User, DiscussionElement } from '@prisma/client';

export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export type AppAbility = PureAbility<
  [
    Action,
    Subjects<{ User: User; Message: DiscussionElement }> | 'all'
  ],
  PrismaQuery
>;
@Injectable()
export class CaslAbilityFactory {

  createAbility(user?: { name: string })
  {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);
	
	if (!user)
    	return build();

    can(Action.Update, 'Message', { author: user.name  })

    return build();
  }
}
