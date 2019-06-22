import { IBlockchainApi } from '@kiltprotocol/sdk-js'

export declare interface BlockchainService {
  connect(): Promise<IBlockchainApi>
}
