import { PublicIdentity, IDidDocumentSigned } from '@kiltprotocol/core'
import { Document } from 'mongoose'
import { Optional } from 'typescript-optional'

export interface Contact {
  metaData: {
    name: string
  }
  did?: IDidDocumentSigned
  publicIdentity: PublicIdentity
}

export interface ContactDB extends Document, Contact {}

export declare interface ContactsService {
  add(contact: Contact): Promise<void>
  list(): Promise<Contact[]>
  findByAddress(address: PublicIdentity['address']): Promise<Optional<Contact>>
  removeAll(): Promise<void>
}
