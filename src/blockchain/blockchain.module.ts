import { Module, Global } from '@nestjs/common';
import { UniversalBlockchainService } from './universal-blockchain.service';

const blockchainServiceProvider = {
  provide: 'BlockchainService',
  useClass: UniversalBlockchainService
};

@Global()
@Module({  
  providers: [blockchainServiceProvider],
  exports: [blockchainServiceProvider]
})
export class BlockchainModule { }
