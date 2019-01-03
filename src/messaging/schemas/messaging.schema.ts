import * as mongoose from 'mongoose'

export const MessageSchema = new mongoose.Schema({
  id: String,
  sender: String,
  senderKey: String,
  senderEncryptionKey: String,
  receiverKey: String,
  message: String,
  nonce: String,
})
