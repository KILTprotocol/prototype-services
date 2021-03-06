import { Balance, Identity } from '@kiltprotocol/core'
import { BlockchainUtils } from '@kiltprotocol/chain-helpers'
import {
  Controller,
  Inject,
  Post,
  Req,
  Body,
  BadRequestException,
  Delete,
  UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import BN from 'bn.js'
import { hexToU8a } from '@polkadot/util'
import { checkAddress, cryptoWaitReady } from '@polkadot/util-crypto'

import { FaucetService } from './interfaces/faucet.interfaces'
import {
  FaucetDropThrottledException,
  FaucetDropFailedTransferException,
  FaucetDropInvalidAddressException,
} from './exceptions'
import { AuthGuard } from '../auth/auth.guard'

const DEFAULT_TOKEN_AMOUNT = 500

@Controller('faucet')
export class FaucetController {
  constructor(
    @Inject('FaucetService') private readonly faucetService: FaucetService
  ) {}

  @Post('drop')
  public async drop(@Body('address') address: string, @Req() request: Request) {
    if (!address) {
      throw new BadRequestException('no target address')
    }
    console.log(`Faucet drop requested for ${address} from ${request.ip}`)
    if (!checkAddress(address, 38)[0]) {
      throw new FaucetDropInvalidAddressException()
    }

    const result = await this.faucetService.drop(
      address,
      request.ip,
      DEFAULT_TOKEN_AMOUNT
    )
    if (result.dropped) {
      const transferSucceeded = await this.transferTokens(result.address)
      if (!transferSucceeded) {
        await this.faucetService.updateOnTransactionFailure(result)
        throw new FaucetDropFailedTransferException()
      }
    } else {
      throw new FaucetDropThrottledException()
    }
  }

  @UseGuards(AuthGuard)
  @Delete()
  public async reset() {
    console.log('Purging faucet drop registry')
    this.faucetService.reset()
  }

  private async transferTokens(address: string): Promise<boolean> {
    try {
      await cryptoWaitReady()
      console.log(`Transfer tokens from faucet to ${address}`)
      const faucetAccount: Identity = Identity.buildFromSeed(
        hexToU8a(process.env.FAUCET_ACCOUNT),
        {
          signingKeyPairType: 'ed25519',
        }
      )
      const tx = await Balance.makeTransfer(
        address,
        new BN(DEFAULT_TOKEN_AMOUNT),
        0
      )
      const status = await BlockchainUtils.signAndSubmitTx(tx, faucetAccount, {
        resolveOn: BlockchainUtils.IS_IN_BLOCK,
      })

      return Promise.resolve(status.isInBlock)
    } catch (e) {
      console.error(e)
      return Promise.resolve(false)
    }
  }
}
