import { Injectable } from '@nestjs/common';
import Optional from 'typescript-optional';
import { AlreadyRegisteredException } from './exceptions/already-registered.exception';
import { CType, CTypeService } from './interfaces/ctype.interfaces';

@Injectable()
export class InMemoryCTypesService implements CTypeService {

    private readonly registration = new Map<string, CType>();

    async findByKey(key: string): Promise<Optional<CType>> {
        const foundCType = this.registration.get(key);
        return Promise.resolve(Optional.ofNullable(foundCType));
    }

    async register(cType: CType): Promise<CType> {
        const found = await this.findByKey(cType.key);
        if (found.isPresent) {
            throw new AlreadyRegisteredException()
        } else {
            this.registration.set(cType.key, cType);
            return cType;
        }
    }

    async removeAll() {
        this.registration.clear();
    }
}
