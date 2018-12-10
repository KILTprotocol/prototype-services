import * as mongoose from 'mongoose';

export const MessageSchema = new mongoose.Schema({
    id: String,
    sender: String,
    receiver: String,
    message: String
});