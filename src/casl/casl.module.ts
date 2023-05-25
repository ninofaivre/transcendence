import { Module, forwardRef } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory/casl-ability.factory';
import { ChansModule } from '../chans/chans.module'
import { UserModule } from 'src/user/user.module';

@Module({
	imports: [forwardRef(() => ChansModule), forwardRef(() => UserModule)],
	providers: [CaslAbilityFactory],
	exports: [CaslAbilityFactory]
})
export class CaslModule {}
