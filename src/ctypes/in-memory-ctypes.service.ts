import { Injectable } from '@nestjs/common';
import Optional from 'typescript-optional';
import { AlreadyRegisteredException } from './exceptions/already-registered.exception';
import { CTypeModel, CTypeService } from './interfaces/ctype.interfaces';

@Injectable()
export class InMemoryCTypesService implements CTypeService {

    private readonly registration = new Map<string, CTypeModel>();

    async findByKey(key: string): Promise<Optional<CTypeModel>> {
        const foundCType = this.registration.get(key);
        return Promise.resolve(Optional.ofNullable(foundCType));
    }

    async findAll(): Promise<Optional<CTypeModel[]>> {
        const ctypes = [];
        this.registration.forEach(ctype => ctypes.push(ctype));
        return Promise.resolve(Optional.ofNullable(ctypes));
    }

    async register(cType: CTypeModel): Promise<CTypeModel> {
        const found = await this.findByKey(cType.key);
        if (found.isPresent) {
            throw new AlreadyRegisteredException();
        } else {
            this.registration.set(cType.key, cType);
            return cType;
        }
    }

    async removeAll() {
        this.registration.clear();
    }
}
