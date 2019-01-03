import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  BadRequestException,
  NotFoundException,
  Body,
} from '@nestjs/common'
import { Contact, ContactsService } from './interfaces/contacts.interfaces'

@Controller('contacts')
export class ContactsController {
  constructor(
    @Inject('ContactsService') private readonly contactService: ContactsService
  ) {}

  @Post()
  public async add(@Body() contact: Contact) {
    if (!contact.key) {
      throw new BadRequestException('no key')
    } else if (!contact.encryptionKey) {
      throw new BadRequestException('no encryption key')
    } else if (!contact.name) {
      throw new BadRequestException('no name')
    }
    this.contactService.add(contact)
  }

  @Get()
  public async list(): Promise<Contact[]> {
    return this.contactService.list()
  }

  @Get(':key')
  public async findByKey(@Param('key') key): Promise<Contact> {
    const result = await this.contactService.findByKey(key)
    return result.orElseThrow(() => new NotFoundException())
  }
}
