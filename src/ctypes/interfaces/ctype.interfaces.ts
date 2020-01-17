import { ICType, ICTypeMetadata } from '@kiltprotocol/sdk-js'
import { Document } from 'mongoose'
import Optional from 'typescript-optional'

export interface CType {
  metaData: ICTypeMetadata
  cType: ICType
}

export interface CTypeDB extends Document {
  metaData: string
  cType: string
  hash: string
}

export declare interface CTypeService {
  register(cType: CType): Promise<void>
  findByHash(hash: ICType['hash']): Promise<Optional<CType>>
  findAll(): Promise<CType[]>
  removeAll(): void
}
