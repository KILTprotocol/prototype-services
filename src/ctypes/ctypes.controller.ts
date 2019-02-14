import * as sdk from '@kiltprotocol/prototype-sdk'
import { Blockchain } from '@kiltprotocol/prototype-sdk'
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common'
import { BlockchainService } from '../blockchain/interfaces/blockchain.interfaces'
import { CTypeNotOnChainException } from './exceptions/ctype-not-on-chain.exception'
import { InvalidCtypeDefinitionException } from './exceptions/invalid-ctype-definition.exception'
import {
  CType,
  CTypeService
} from './interfaces/ctype.interfaces'

@Controller('ctype')
export class CTypesController {
  constructor(
    @Inject('CTypeService') private readonly cTypesService: CTypeService,
    @Inject('BlockchainService')
    private readonly blockchainService: BlockchainService
  ) {
  }

  @Get(':hash')
  public async getByKey(@Param('hash') hash): Promise<CType> {
    console.log(`Search CType by hash ${hash}`)
    const result = await this.cTypesService.findByHash(hash)
    return result.orElseThrow(() => new NotFoundException())
  }

  @Get()
  public async getAll(): Promise<CType[]> {
    return await this.cTypesService.findAll()
  }

  @Delete()
  public async removeAll() {
    console.log('Remove all CTypes')
    await this.cTypesService.removeAll()
  }

  @Post()
  public async register(@Body() cTypeInput: CType) {
    console.log('Validate CType definition: ' + {...cTypeInput.cType})
    return this.verifyCType(cTypeInput)
        .then((verified) => {
          if (verified) {
            console.log(`All valid => registering cType ` + cTypeInput.cType.metadata.title.default)
            this.cTypesService.register(cTypeInput)
          } else {
            throw new CTypeNotOnChainException()
          }
        })
  }

  private async verifyCType(cTypeInput: CType): Promise<boolean> {
    try {
      const {cType} = JSON.parse(JSON.stringify(cTypeInput))
      delete cType.hash
      const blockchain: Blockchain = await this.blockchainService.connect()
      return await new sdk.CType(cType).verifyStored(blockchain)
    } catch (e) {
      console.log('error: ' + e)
      throw new InvalidCtypeDefinitionException()
    }
  }
}
