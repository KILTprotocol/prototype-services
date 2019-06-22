import * as sdk from '@kiltprotocol/sdk-js'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import Optional from 'typescript-optional'
import { AlreadyRegisteredException } from './exceptions/already-registered.exception'
import { CType, CTypeDB, CTypeService } from './interfaces/ctype.interfaces'

@Injectable()
export class MongoDbCTypesService implements CTypeService {
  constructor(
    @InjectModel('CType') private readonly cTypeDBModel: Model<CTypeDB>
  ) {}

  public async register(cType: CType): Promise<void> {
    const value = await this.findByHash(cType.cType.hash)
    if (value.isPresent) {
      throw new AlreadyRegisteredException()
    }

    const createdCType = new this.cTypeDBModel({
      metaData: cType.metaData,
      cType: JSON.stringify(cType.cType),
      hash: cType.cType.hash,
    } as CTypeDB)
    await createdCType.save()
  }

  public async findByHash(hash: sdk.ICType['hash']): Promise<Optional<CType>> {
    const result = await this._findByHash(hash)
    return result.map((cTypeDB: CTypeDB): CType => convertToCType(cTypeDB))
  }

  public async findAll(): Promise<CType[]> {
    const result: CTypeDB[] = await this.cTypeDBModel.find().exec()
    return result.map((cTypeDB: CTypeDB): CType => convertToCType(cTypeDB))
  }

  public async removeAll(): Promise<void> {
    await this.cTypeDBModel.deleteMany({}).exec()
  }

  private async _findByHash(
    hash: sdk.ICType['hash']
  ): Promise<Optional<CTypeDB>> {
    const result: CTypeDB = await this.cTypeDBModel.findOne({ hash }).exec()
    return Optional.ofNullable(result)
  }
}

function convertToCType(cTypeDB: CTypeDB): CType {
  const { metaData, cType } = cTypeDB
  return {
    metaData,
    cType: JSON.parse(cType),
  }
}
