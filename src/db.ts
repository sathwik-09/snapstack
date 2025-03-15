import mongoose from "mongoose";
import { Schema, Model } from "mongoose";

mongoose.connect('mongodb+srv://sathwik:Sathwik123@cluster0.iunwd.mongodb.net/snapstack')

const userSchema = new Schema({
  username: {type: String, required: true, unique: true},
  email: {type: String, required: true, unique: true},
  password: {type: String, required: true}
});

export const userModel = mongoose.model('User', userSchema)

const contentSchema = new Schema({
  title: {type: String, required: true},
  link: {type: String, required: true},
  tags: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}],
  userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'}
});

export const contentModel = mongoose.model('Content', contentSchema);


