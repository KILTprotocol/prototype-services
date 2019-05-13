import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { Contact, ContactsService } from './interfaces/contacts.interfaces'
import { BlockchainService } from '../blockchain/interfaces/blockchain.interfaces'
import { Crypto } from '@kiltprotocol/prototype-sdk'
import Optional from 'typescript-optional'
import { AuthGuard } from 'src/auth/auth.guard'

@Controller('contacts')
export class ContactsController {
  constructor(
    @Inject('ContactsService') private readonly contactService: ContactsService
  ) {}

  @Post()
  public async add(@Body() contact: Contact) {
    if (!contact.publicIdentity.address) {
      throw new BadRequestException('no address')
    } else if (!contact.publicIdentity.boxPublicKeyAsHex) {
      throw new BadRequestException('no boxPublicKeyAsHex')
    } else if (!contact.metaData.name) {
      throw new BadRequestException('no name')
    }
    if (contact.did) {
      if (!contact.signature) {
        throw new BadRequestException('no signature')
      }

      const hash = Crypto.hashStr(JSON.stringify(contact.did))
      if (
        !Crypto.verify(hash, contact.signature, contact.publicIdentity.address)
      ) {
        throw new BadRequestException('bad signature for hash')
      }
    }
    this.contactService.add(contact)
  }

  @Get()
  public async list(): Promise<Contact[]> {
    return this.contactService.list()
  }

  @Get(':address')
  public async findByKey(@Param('address') address): Promise<Contact> {
    const result = await this.contactService.findByAddress(address)
    return result.orElseThrow(() => new NotFoundException())
  }

  @UseGuards(AuthGuard)
  @Delete()
  public async removeAll() {
    console.log('Remove all contacts')
    await this.contactService.removeAll()
  }

  @Get('did/:address')
  public async getDidDocument(@Param('address') address): Promise<object> {
    const result: Optional<Contact> = await this.contactService.findByAddress(
      address
    )
    return result
      .filter((contact: Contact) => !!contact.did)
      .map((contact: Contact) => contact.did)
      .orElseThrow(() => new NotFoundException())
  }
}
