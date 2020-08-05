import { Blockchain } from '@kiltprotocol/sdk-js'

export declare interface BlockchainService {
  connect(): Promise<Blockchain>
}
