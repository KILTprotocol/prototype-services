import { Blockchain } from '@kiltprotocol/prototype-sdk'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '../config/config.service'
import { BlockchainService } from './interfaces/blockchain.interfaces'

@Injectable()
export class UniversalBlockchainService implements BlockchainService {
  constructor(
    @Inject('ConfigService') private readonly configService: ConfigService
  ) {}

  public async connect(): Promise<Blockchain> {
    const bootNodeAddress = this.configService.get('BOOT_NODE_ADDRESS')
    console.log(`Connecting to  ${bootNodeAddress}`)
    return Promise.resolve(Blockchain.build(bootNodeAddress))
  }
}
