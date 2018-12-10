import * as mongoose from 'mongoose';

export const ContactSchema = new mongoose.Schema({
    key: String,
    name: String
});