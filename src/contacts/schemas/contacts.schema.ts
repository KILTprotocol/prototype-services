import * as mongoose from 'mongoose'

export const ContactSchema = new mongoose.Schema({
  metaData: {
    name: String,
  },
  publicIdentity: {
    address: String,
    boxPublicKeyAsHex: String,
  },
})
