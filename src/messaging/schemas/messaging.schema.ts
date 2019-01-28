import * as mongoose from 'mongoose'

export const MessageSchema = new mongoose.Schema({
  id: String,
  message: String,
  nonce: String,
  receiverAddress: String,
  senderAddress: String,
})
