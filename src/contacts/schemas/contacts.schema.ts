import * as mongoose from 'mongoose'

export const ContactSchema = new mongoose.Schema({
  metaData: {
    name: String,
  },
  did: Object,
  publicIdentity: {
    address: String,
    boxPublicKeyAsHex: String,
    serviceAddress: String,
  },
})
