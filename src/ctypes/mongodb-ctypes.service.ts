import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Optional from 'typescript-optional';
import { AlreadyRegisteredException } from './exceptions/already-registered.exception';
import { CType, CTypeService } from './interfaces/ctype.interfaces';

@Injectable()
export class MongoDbCTypesService implements CTypeService {

    constructor(@InjectModel('CType') private readonly cTypeModel: Model<CType>) { }

    async register(cType: CType): Promise<CType> {
        const value = await this.findByKey(cType.key)
        if (value.isPresent) {
            throw new AlreadyRegisteredException()
        }

        const createdCType = new this.cTypeModel(cType);
        return await createdCType.save();
    }

    async findByKey(key: string): Promise<Optional<CType>> {
        const val = await this.cTypeModel.findOne({ key: key }).exec();
        return Optional.ofNullable(val);
    }

    async removeAll() {
        await this.cTypeModel.deleteMany({}).exec();
    }
}
