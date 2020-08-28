import * as mongoose from 'mongoose'

export const FaucetDropSchema = new mongoose.Schema({
  publickey: String,
  requestip: String,
  amount: Number,
  dropped: Boolean,
  error: Number,
  created: Number,
})
