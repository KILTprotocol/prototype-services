import { Blockchain, Identity } from '@kiltprotocol/prototype-sdk'
import {
  Controller,
  Get,
  Inject,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common'
import { BlockchainService } from '../blockchain/interfaces/blockchain.interfaces'
import { FaucetAuthGuard } from './faucet.auth.guard'

@Controller('faucet')
export class FaucetController {
  constructor(
    @Inject('BlockchainService')
    private readonly blockchainService: BlockchainService
  ) {}

  /**
   * Transfer a certain amount of Kilt to an account.
   *
   * Call with curl:
   *
   *   curl -X GET -H "Authorization: {FAUCET_SECRET}" \
   *        "http://{services-url}/faucet/transfer?receiverAddress={adress}&amount={amount}"
   *
   * @param receiverAddress address of the receiver account
   * @param amount the amount of Kilt to tranfer
   */
  @Get('transfer')
  @UseGuards(FaucetAuthGuard)
  public async transfer(
    @Query('receiverAddress') receiverAddress: string,
    @Query('amount') amount: number
  ): Promise<void> {
    const blockchain: Blockchain = await this.blockchainService.connect()
    const alice = Identity.buildFromURI('//Alice')

    console.log(`Transferring ${amount} tokens to ${receiverAddress}`)
    await blockchain.makeTransfer(alice, receiverAddress, amount)
  }
}
