import { IBlockchainApi } from '@kiltprotocol/prototype-sdk'

export declare interface BlockchainService {
  connect(): Promise<IBlockchainApi>
}
