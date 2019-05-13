import Kilt, { IBlockchainApi } from '@kiltprotocol/prototype-sdk'
import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { ConfigService } from '../config/config.service'
import { BlockchainService } from './interfaces/blockchain.interfaces'

@Injectable()
export class UniversalBlockchainService
  implements BlockchainService, OnApplicationBootstrap {
  private static instance: Promise<IBlockchainApi>
  constructor(
    @Inject('ConfigService') private readonly configService: ConfigService
  ) {}

  public async connect(): Promise<IBlockchainApi> {
    const bootNodeAddress = this.configService.get('BOOT_NODE_ADDRESS')
    console.log(`Connecting to  ${bootNodeAddress}`)
    if (!UniversalBlockchainService.instance) {
      UniversalBlockchainService.instance = Kilt.connect(bootNodeAddress)
    }
    return Promise.resolve(UniversalBlockchainService.instance)
  }

  public onApplicationBootstrap() {
    this.connect()
  }
}
