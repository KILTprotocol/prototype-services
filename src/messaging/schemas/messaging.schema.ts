import * as mongoose from 'mongoose'

export const MessageSchema = new mongoose.Schema({
  id: String,
  message: String,
  messageId: String,
  nonce: String,
  receiverAddress: String,
  senderAddress: String,
})
