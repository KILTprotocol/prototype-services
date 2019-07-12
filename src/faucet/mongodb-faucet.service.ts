import * as sdk from '@kiltprotocol/sdk-js'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { FaucetDrop, FaucetDropDB, FaucetService } from './interfaces/faucet.interfaces'
import Optional from 'typescript-optional'

const MAX_REQUESTS_PER_ID = 1
const MAX_IDENTITIES_PER_IP = 100
const MAX_REQUESTS_PER_DAY = 10000
const ONE_DAY = 24 * 60 * 60 * 1000

const NO_ERROR = 0
const ERROR_MAX_REQUESTS_PER_ID = 1
const ERROR_MAX_REQUESTS_PER_DAY = 2
const ERROR_MAX_REQUESTS_PER_IP = 3
const ERROR_TRANSACTION_FAILED = 4

@Injectable()
export class MongoDbFaucetService implements FaucetService {

  constructor(
    @InjectModel('FaucetDrop') private readonly faucetDropDBModel: Model<FaucetDropDB>
  ) {
  }

  public async drop(email: string, publickey: string, ip: string, amount: number): Promise<FaucetDrop> {
    let error: number = NO_ERROR
    const dropsPerIdentity: number = await this.faucetDropDBModel.countDocuments({
      'publickey': publickey,
      'error': 0
    }).exec()
    if (dropsPerIdentity >= MAX_REQUESTS_PER_ID) {
      error = ERROR_MAX_REQUESTS_PER_ID
    } else {
      const dropsPerIP: number = await this.faucetDropDBModel.countDocuments({ 'requestip': ip, 'error': 0 }).exec()
      if (dropsPerIP >= MAX_IDENTITIES_PER_IP) {
        error = ERROR_MAX_REQUESTS_PER_IP
      } else {
        const dropsPerDay: number = await this.faucetDropDBModel.countDocuments({
          'created': { '$gt': Date.now() - ONE_DAY },
          'error': 0
        }).exec()
        if (dropsPerDay >= MAX_REQUESTS_PER_DAY) {
          error = ERROR_MAX_REQUESTS_PER_DAY
        }
      }
    }

    const result = {
      amount,
      email,
      publickey,
      requestip: ip,
      dropped: error === NO_ERROR,
      error,
      created: Date.now(),
    } as FaucetDrop

    const createdFaucetDrop = new this.faucetDropDBModel(result as FaucetDropDB)
    await createdFaucetDrop.save()
    return Promise.resolve(createdFaucetDrop as FaucetDrop)
  }

  public async updateOnTransactionFailure(drop: FaucetDrop): Promise<void> {
    drop.error = ERROR_TRANSACTION_FAILED
    drop.dropped = false
    const updatedFaucetDrop = new this.faucetDropDBModel(drop)
    await updatedFaucetDrop.save()
  }
}
