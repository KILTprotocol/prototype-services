import { Balance, Identity, SubmittableResult } from '@kiltprotocol/sdk-js'
import {
  Controller,
  Inject,
  Post,
  Req,
  Body,
  BadRequestException,
} from '@nestjs/common'
import { Request } from 'express'
import BN from 'bn.js'
import { hexToU8a } from '@polkadot/util'
import { checkAddress } from '@polkadot/util-crypto'

import { FaucetService } from './interfaces/faucet.interfaces'
import {
  FaucetDropThrottledException,
  FaucetDropFailedTransferException,
  FaucetDropInvalidAddressException,
} from './exceptions'

const KILT_FEMTO_COIN = '1000000000000000'
const DEFAULT_TOKEN_AMOUNT = 500

@Controller('faucet')
export class FaucetController {
  constructor(
    @Inject('FaucetService') private readonly faucetService: FaucetService
  ) {}

  @Post('drop')
  public async drop(@Body('pubkey') pubKey: string, @Req() request: Request) {
    if (!pubKey) {
      throw new BadRequestException('no public key')
    }
    console.log(`Faucet drop requested for ${pubKey} from ${request.ip}`)

    if (!checkAddress(pubKey, 42)[0]) {
      throw new FaucetDropInvalidAddressException()
    }

    const result = await this.faucetService.drop(
      pubKey,
      request.ip,
      DEFAULT_TOKEN_AMOUNT
    )
    if (result.dropped) {
      const transferSucceeded = await this.transferTokens(result.publickey)
      if (!transferSucceeded) {
        await this.faucetService.updateOnTransactionFailure(result)
        throw new FaucetDropFailedTransferException()
      }
    } else {
      throw new FaucetDropThrottledException()
    }
  }

  private async transferTokens(address: string): Promise<boolean> {
    try {
      console.log(`Transfer tokens from faucet to ${address}`)
      const faucetAccount: Identity = await Identity.buildFromSeed(
        hexToU8a(process.env.FAUCET_ACCOUNT)
      )
      const status: SubmittableResult = await Balance.makeTransfer(
        faucetAccount,
        address,
        new BN(KILT_FEMTO_COIN).muln(DEFAULT_TOKEN_AMOUNT)
      )
      return Promise.resolve(status.isFinalized)
    } catch (e) {
      console.error(e)
      return Promise.resolve(false)
    }
  }
}
