import * as mongoose from 'mongoose'

export const CTypeSchema = new mongoose.Schema({
  metaData: mongoose.Schema.Types.Mixed,
  cType: mongoose.Schema.Types.Mixed,
  hash: String,
})
