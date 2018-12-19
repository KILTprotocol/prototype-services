import * as mongoose from 'mongoose';

export const ContactSchema = new mongoose.Schema({
    key: String,
    encryptionKey: String,
    name: String
});