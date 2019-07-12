import * as mongoose from 'mongoose'

export const FaucetDropSchema = new mongoose.Schema({
  email: String,
  publickey: String,
  requestip: String,
  amount: Number,
  dropped: Boolean,
  error: Number,
  created: Number,
})
