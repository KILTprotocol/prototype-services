import * as sdk from '@kiltprotocol/prototype-sdk'
import { Document } from 'mongoose'
import Optional from 'typescript-optional'

export interface Contact {
  metaData: {
    name: string
  }
  publicIdentity: sdk.PublicIdentity
}

export interface ContactDB extends Document, Contact {}

export declare interface ContactsService {
  add(contact: Contact): void
  list(): Promise<Contact[]>
  findByAddress(
    address: sdk.PublicIdentity['address']
  ): Promise<Optional<Contact>>
  removeAll(): void
}
