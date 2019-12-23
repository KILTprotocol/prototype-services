import { Balance, Identity, TxStatus } from '@kiltprotocol/sdk-js'
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
import { decodeAddress } from '@polkadot/keyring'

import { FaucetService } from './interfaces/faucet.interfaces'
import {
  FaucetDropThrottledException,
  FaucetDropFailedTransferException,
  FaucetDropInvalidAddressException,
} from './exceptions'

const KILT_MICRO_COIN: number = 1_000_000
const DEFAULT_TOKEN_AMOUNT: number = 500 * KILT_MICRO_COIN

@Controller('faucet')
export class FaucetController {
  constructor(
    @Inject('FaucetService') private readonly faucetService: FaucetService
  ) {}

  @Post('drop')
  public async drop(
    @Body('email') email: string,
    @Body('pubkey') pubKey: string,
    @Req() request: Request
  ) {
    if (!pubKey) {
      throw new BadRequestException('no public key')
    }
    console.log(`Faucet drop requested for ${pubKey} from ${request.ip}`)

    try {
      decodeAddress(pubKey)
    } catch {
      throw new FaucetDropInvalidAddressException()
    }

    const result = await this.faucetService.drop(
      email,
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
      const faucetAccount: Identity = Identity.buildFromSeed(
        hexToU8a(process.env.FAUCET_ACCOUNT)
      )
      const status: TxStatus = await Balance.makeTransfer(
        faucetAccount,
        address,
        new BN(DEFAULT_TOKEN_AMOUNT)
      )
      return Promise.resolve(status.type === 'Finalised')
    } catch (e) {
      console.error(e)
      return Promise.resolve(false)
    }
  }
}
