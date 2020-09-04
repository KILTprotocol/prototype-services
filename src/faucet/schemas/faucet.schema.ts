import * as mongoose from 'mongoose'

export const FaucetDropSchema = new mongoose.Schema({
  address: String,
  requestip: String,
  amount: Number,
  dropped: Boolean,
  error: Number,
  created: Number,
})
