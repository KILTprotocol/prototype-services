import { ICType } from '@kiltprotocol/sdk-js'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import Optional from 'typescript-optional'
import { CType, CTypeDB, CTypeService } from './interfaces/ctype.interfaces'

@Injectable()
export class MongoDbCTypesService implements CTypeService {
  constructor(
    @InjectModel('CType') private readonly cTypeDBModel: Model<CTypeDB>
  ) {}

  public async register(cType: CType): Promise<boolean> {
    const value = await this.findByHash(cType.cType.hash)
    if (value.isPresent) {
      return false
    }
    const createdCType = new this.cTypeDBModel({
      metaData: JSON.stringify(cType.metaData),
      cType: JSON.stringify(cType.cType),
      hash: cType.cType.hash,
    } as CTypeDB)
    await createdCType.save()
    return true
  }

  public async findByHash(hash: ICType['hash']): Promise<Optional<CType>> {
    const result = await this.cTypeDBModel.findOne({ hash }).exec()
    return Optional.ofNullable<CTypeDB>(result).map(
      (cTypeDB: CTypeDB): CType => this.convertToCType(cTypeDB)
    )
  }

  public async findAll(): Promise<CType[]> {
    const result: CTypeDB[] = await this.cTypeDBModel.find().exec()
    return result.map((cTypeDB: CTypeDB): CType => this.convertToCType(cTypeDB))
  }

  public async removeAll(): Promise<void> {
    await this.cTypeDBModel.deleteMany({}).exec()
  }

  private convertToCType(cTypeDB: CTypeDB): CType {
    const { metaData, cType } = cTypeDB
    return {
      metaData: JSON.parse(metaData),
      cType: JSON.parse(cType),
    } as CType
  }
}
