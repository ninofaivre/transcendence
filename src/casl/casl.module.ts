import { Module, forwardRef } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory/casl-ability.factory';
import { ChansModule } from '../chans/chans.module'

@Module({
	imports: [forwardRef(() => ChansModule)],
	providers: [CaslAbilityFactory],
	exports: [CaslAbilityFactory]
})
export class CaslModule {}
