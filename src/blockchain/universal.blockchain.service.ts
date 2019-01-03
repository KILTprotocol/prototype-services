import {Injectable} from "@nestjs/common";
import {BlockchainService} from "./interfaces/blockchain.interfaces";
import {Blockchain} from "@kiltprotocol/prototype-sdk";

@Injectable()
export class UniversalBlockchainService implements BlockchainService {

  async connect(): Promise<Blockchain> {
    return Promise.resolve(Blockchain.build())
  }
}