import { CType as SDKCType, CTypeUtils } from '@kiltprotocol/sdk-js'
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
import { AlreadyRegisteredException } from './exceptions/already-registered.exception'
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
    const verified = this.verifyCType(cTypeInput)
    if (verified) {
      console.log(
        `All valid => registering cType ` +
          JSON.stringify(
            { ...cTypeInput.cType, owner: cTypeInput.cType.owner },
            null,
            4
          )
      )
    }

    const result = await this.cTypesService.register({
      ...cTypeInput,
    })

    if (!result) {
      console.log(
        `The CType with hash: ${
          cTypeInput.cType.hash
        } already exists in this DB!`
      )
      throw new AlreadyRegisteredException()
    } else {
      throw new CTypeNotOnChainException()
    }
  }

  private verifyCType(cTypeInput: CType) {
    try {
      new SDKCType(cTypeInput.cType)
      return CTypeUtils.verifyStored(cTypeInput.cType)
    } catch {
      throw new InvalidCtypeDefinitionException()
    }
  }
}
