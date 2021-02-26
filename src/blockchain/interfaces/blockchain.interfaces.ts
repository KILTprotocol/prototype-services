import { Blockchain } from '@kiltprotocol/chain-helpers'

export declare interface BlockchainService {
  connect(): Promise<Blockchain>
}
