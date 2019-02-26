import * as mongoose from 'mongoose'

export const MessageSchema = new mongoose.Schema({
  id: String,
  messageId: String,
  receivedAt: Number,
  message: String,
  nonce: String,
  createdAt: Number,
  hash: String,
  signature: String,
  receiverAddress: String,
  senderAddress: String,
})
