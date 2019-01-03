import * as mongoose from 'mongoose'

export const CTypeSchema = new mongoose.Schema({
  key: String,
  name: String,
  author: String,
  definition: String,
})
