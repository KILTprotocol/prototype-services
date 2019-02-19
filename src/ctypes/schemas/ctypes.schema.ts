import * as mongoose from 'mongoose'

export const CTypeSchema = new mongoose.Schema({
  metaData: {
    author: String,
  },
  cType: mongoose.Schema.Types.Mixed,
  hash: String,
})
