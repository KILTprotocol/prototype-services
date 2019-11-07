import { CType as SDKCtype } from '@kiltprotocol/sdk-js'
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { BlockchainService } from '../blockchain/interfaces/blockchain.interfaces'
import { CTypeNotOnChainException } from './exceptions/ctype-not-on-chain.exception'
import { InvalidCtypeDefinitionException } from './exceptions/invalid-ctype-definition.exception'
import { CType, CTypeService } from './interfaces/ctype.interfaces'
import { AuthGuard } from '../auth/auth.guard'

@Controller('ctype')
export class CTypesController {
  constructor(
    @Inject('CTypeService') private readonly cTypesService: CTypeService,
    @Inject('BlockchainService')
    private readonly blockchainService: BlockchainService
  ) {}

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

  @UseGuards(AuthGuard)
  @Delete()
  public async removeAll() {
    console.log('Remove all CTypes')
    await this.cTypesService.removeAll()
  }

  @Post()
  public async register(@Body() cTypeInput: CType) {
    return this.verifyCType(cTypeInput).then(verified => {
      if (verified) {
        console.log(
          `All valid => registering cType ` + cTypeInput.cType.schema.$id
        )
        this.cTypesService.register(cTypeInput)
      } else {
        throw new CTypeNotOnChainException()
      }
    })
  }

  private async verifyCType(cTypeInput: CType): Promise<boolean> {
    try {
      const { cType } = cTypeInput
      return await new SDKCtype(cType).verifyStored()
    } catch (e) {
      console.log('error: ' + e)
      throw new InvalidCtypeDefinitionException()
    }
  }
}
