import { Document } from 'mongoose'
import Optional from 'typescript-optional'

export interface CTypeModel extends Document {
  key: string
  name: string
  author: string
  definition: string
}

export declare interface CTypeService {
  register(cType: CTypeModel): Promise<CTypeModel>
  findByKey(key: string): Promise<Optional<CTypeModel>>
  findAll(): Promise<Optional<CTypeModel[]>>
  removeAll(): void
}
