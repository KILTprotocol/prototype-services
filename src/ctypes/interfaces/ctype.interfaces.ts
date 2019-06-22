import * as sdk from '@kiltprotocol/sdk-js'
import { Document } from 'mongoose'
import Optional from 'typescript-optional'

export interface CType {
  metaData: {
    author: string
  }
  cType: sdk.ICType
}

export interface CTypeDB extends Document {
  metaData: {
    author: string
  }
  cType: string
  hash: string
}

export declare interface CTypeService {
  register(cType: CType): Promise<void>
  findByHash(hash: sdk.ICType['hash']): Promise<Optional<CType>>
  findAll(): Promise<CType[]>
  removeAll(): void
}
