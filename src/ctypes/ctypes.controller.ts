import { Body, Controller, Get, Inject, NotFoundException, Param, Post, Delete } from '@nestjs/common';
import { CTypeModel, CTypeService } from './interfaces/ctype.interfaces';
import {CType} from "@kiltprotocol/prototype-sdk";
import {InvalidCtypeDefinitionException} from "./exceptions/invalid-ctype-definition.exception";
import {Blockchain} from "@kiltprotocol/prototype-sdk";
import {CTypeNotOnChainException} from "./exceptions/ctype-not-on-chain.exception";
import {BlockchainService} from "../blockchain/interfaces/blockchain.interfaces";

@Controller('ctype')
export class CTypesController {
  constructor(@Inject('CTypeService') private readonly cTypesService: CTypeService,
              @Inject('BlockchainService') private readonly blockchainService: BlockchainService) {}

  @Get(':key')
  async getByKey(@Param('key') key): Promise<CTypeModel> {
    console.log(`Search CType by key ${key}`);
    const result = await this.cTypesService.findByKey(key);
    return result.orElseThrow(() => new NotFoundException());
  }

  @Get()
  async getAll(): Promise<CTypeModel[]> {
    const result = await this.cTypesService.findAll();
    return result.orElseGet(() => []);
  }

  @Delete()
  async removeAll() {
    console.log('Remove all CTypes');
    await this.cTypesService.removeAll();
  }

  private getCType(cTypeInput: CTypeModel): CType {
    try {
      const ctypeDefinition: any = JSON.parse(cTypeInput.definition);
      delete ctypeDefinition.hash;
      return new CType(ctypeDefinition);
    } catch(e) {
      console.log('error: ' + e);
      throw new InvalidCtypeDefinitionException();
    }
  }

  @Post()
  async register(@Body() cTypeInput: CTypeModel) {
    console.log('Validate CType definition: ' + cTypeInput.definition);
    const cTypeModel: CType = this.getCType(cTypeInput);

    console.log(`Check CType on chain`);
    const blockchain: Blockchain = await this.blockchainService.connect();
    const storedValue = await cTypeModel.verifyStored(blockchain);
    if (storedValue) {
      console.log(`All valid => register ctype ` + cTypeInput.name);
      this.cTypesService.register(cTypeInput);
    } else {
      throw new CTypeNotOnChainException();
    }

  }
}
