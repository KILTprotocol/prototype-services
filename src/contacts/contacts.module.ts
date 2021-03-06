import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ContactsController } from './contacts.controller'
import { MongoDbMContactsService } from './mongodb-contacts.service'
import { ContactSchema } from './schemas/contacts.schema'

const contactsServiceProvider = {
  provide: 'ContactsService',
  useClass: MongoDbMContactsService,
}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Contact', schema: ContactSchema, collection: 'Contact' },
    ]),
  ],
  controllers: [ContactsController],
  providers: [contactsServiceProvider],
})
export class ContactsModule {}
