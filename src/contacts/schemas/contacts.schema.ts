import * as mongoose from 'mongoose'

export const ContactSchema = new mongoose.Schema({
  metaData: {
    name: String,
  },
  did: Object,
  signature: String,
  publicIdentity: {
    address: String,
    boxPublicKeyAsHex: String,
    serviceAddress: String,
  },
})
