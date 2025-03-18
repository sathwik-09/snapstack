import express from 'express';
import jwt from 'jsonwebtoken';
import {z} from 'zod'
import { contentModel, linkModel, userModel } from './db';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { userMiddleware } from './middleware';
import mongoose from 'mongoose';
import { random } from './utils';
dotenv.config();

const app = express();

app.use(express.json());


app.post('/api/v1/signup', async (req, res) => {
  const requiredBody = z.object({
    username: z.string(),
    email: z.string().email(),
    password: z.string().min(8)
  });
  const parsedBody = requiredBody.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({ message: "Incorrect Body" });
    return;
  }
  const { username, email, password } = parsedBody.data;
  const hashedPassword = await bcrypt.hash(password, 10);
  try{
    await userModel.create({
      username: username,
      email: email,
      password: hashedPassword
    })
    res.json({
      message: "signup successful"
    })
  } catch(e){
    console.error("Error creating user:",e);
    res.status(411).json({
      message: "User already exists"
    })
  }
})

app.post('/api/v1/signin', async(req,res)=>{
  const {username, password} = req.body;
  const existingUser = await userModel.findOne({username: username});
  if(!existingUser){
    res.status(401).json({
      message: "User not found"
    })
    return;
  }
  const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
  if(!isPasswordCorrect){
    res.status(401).json({
      message: "Incorrect Credentials"
    })
    return;
  }
  const token = jwt.sign({id: existingUser._id}, process.env.JWT_SECRET as string);
  console.log(token);
  res.json({
    message: "Sign in successful",
    token: token
  })
})

app.post('/api/v1/content', userMiddleware, async (req,res)=>{
  const {title, link} = req.body;
  await contentModel.create({
    title,
    link,
    // @ts-ignore
    userId: req.userId,
    tags: []
  })

  res.json({
    message: "Content added successfully"
  })

})


app.get('/api/v1/content', userMiddleware, async (req,res)=>{
  // @ts-ignore
  const userId = req.userId;
  const content = await contentModel.find({userId: userId}).populate('userId', 'username');
  res.json(content);
})

app.delete('/api/v1/content/:id', userMiddleware, async (req,res)=>{
  try { 
    const contentId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      res.status(400).json({ message: "Invalid content ID" });
    }
    const content = await contentModel.deleteOne({
      _id: contentId,
      // @ts-ignore
      userId: req.userId
    });
    if(content.deletedCount === 0){
      res.status(404).json({
        message: "Content not found"
    })
    return;
    }
    res.json({
        message: "Content deleted successfully"
    })
  } 
  catch (e) {
    console.error("Error deleting content:", e);
    res.status(500).json({
      message: "Internal server error"
    })
  }
})

app.post("/api/v1/content/stack/share", userMiddleware, async (req,res)=>{
  const {share} = req.body;
  if(share){
    await linkModel.create({
      hash: random(10),
      //@ts-ignore
      userId: req.userId
    })
  } else {
    await linkModel.deleteOne({
      //@ts-ignore
      userId: req.userId
    })
  }
  res.json({
    message: "updated sharable link"
  })
})

app.post('/api/v1/content/stack/share/link', userMiddleware, async (req,res)=>{

})


app.listen(3000);