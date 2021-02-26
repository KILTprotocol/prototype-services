import Kilt from '@kiltprotocol/sdk-js'
import { Blockchain } from '@kiltprotocol/chain-helpers'

import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { ConfigService } from '../config/config.service'
import { BlockchainService } from './interfaces/blockchain.interfaces'

@Injectable()
export class UniversalBlockchainService
  implements BlockchainService, OnApplicationBootstrap {
  private static instance: Promise<Blockchain>
  constructor(
    @Inject('ConfigService') private readonly configService: ConfigService
  ) {}

  public async connect(): Promise<Blockchain> {
    const bootNodeAddress = this.configService.get('BOOT_NODE_ADDRESS')
    Kilt.config({ address: bootNodeAddress })
    console.log(`Connecting to  ${bootNodeAddress}`)
    if (!UniversalBlockchainService.instance) {
      UniversalBlockchainService.instance = Kilt.connect()
    }
    return Promise.resolve(UniversalBlockchainService.instance)
  }

  public onApplicationBootstrap() {
    this.connect()
  }
}
