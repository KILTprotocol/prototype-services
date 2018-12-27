import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Optional from 'typescript-optional';
import { AlreadyRegisteredException } from './exceptions/already-registered.exception';
import { CTypeModel, CTypeService } from './interfaces/ctype.interfaces';

@Injectable()
export class MongoDbCTypesService implements CTypeService {

    constructor(@InjectModel('CTypeModel') private readonly cTypeModel: Model<CTypeModel>) { }

    async register(cType: CTypeModel): Promise<CTypeModel> {
        const value = await this.findByKey(cType.key);
        if (value.isPresent) {
            throw new AlreadyRegisteredException();
        }

        const createdCType = new this.cTypeModel(cType);
        return await createdCType.save();
    }

    async findByKey(key: string): Promise<Optional<CTypeModel>> {
        const val = await this.cTypeModel.findOne({ key }).exec();
        return Optional.ofNullable(val);
    }

    async findAll(): Promise<Optional<CTypeModel[]>> {
        const val = await this.cTypeModel.find().exec();
        return Optional.ofNullable(val);
    }

    async removeAll() {
        await this.cTypeModel.deleteMany({}).exec();
    }
}
