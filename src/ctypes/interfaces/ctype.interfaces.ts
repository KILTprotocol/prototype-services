import { Document } from 'mongoose';
import Optional from 'typescript-optional';

export interface CType extends Document {
    key: string;
    name: string;
    author: string;
    definition: string;
}

export declare interface CTypeService {
    register(cType: CType): Promise<CType>;
    findByKey(key: string): Promise<Optional<CType>>;
    findAll(): Promise<Optional<CType[]>>;
    removeAll();
}
