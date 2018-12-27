import {Blockchain} from "@kiltprotocol/prototype-sdk";


export declare interface BlockchainService {
  connect(): Promise<Blockchain>;
}