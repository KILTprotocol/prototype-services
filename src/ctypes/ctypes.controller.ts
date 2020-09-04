import { CType as SDKCtype } from '@kiltprotocol/sdk-js'
import { getOwner } from '@kiltprotocol/sdk-js/build/ctype/CType.chain'
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
    return this.verifyCTypeAndReturnChainOwner(cTypeInput).then(
      async verified => {
        if (verified) {
          console.log(
            `All valid => registering cType ` +
              JSON.stringify({ ...cTypeInput.cType, owner: verified }, null, 4)
          )

          const result = await this.cTypesService.register({
            ...cTypeInput,
            cType: { ...cTypeInput.cType, owner: verified },
          })

          if (!result) {
            console.log(
              `The CType with hash: ${
                cTypeInput.cType.hash
              } already exists in this DB!`
            )
            throw new AlreadyRegisteredException()
          }
        } else {
          throw new CTypeNotOnChainException()
        }
      }
    )
  }

  private async verifyCTypeAndReturnChainOwner(
    cTypeInput: CType
  ): Promise<string | null> {
    try {
      const cType = new SDKCtype(cTypeInput.cType)

      return getOwner(cType.hash)
    } catch (e) {
      console.log('error: ' + e)
      throw new InvalidCtypeDefinitionException()
    }
  }
}
