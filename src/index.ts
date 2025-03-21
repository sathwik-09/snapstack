import express, { json } from 'express';
import jwt from 'jsonwebtoken';
import {z} from 'zod'
import { contentModel, linkModel, userModel } from './db';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { userMiddleware } from './middleware';
import mongoose from 'mongoose';
import {randomHash } from './utils';
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());


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
  const {email, password} = req.body;
  const existingUser = await userModel.findOne({ email: email});
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
  try{
     // @ts-ignore
    const userId = req.userId;
    const content = await contentModel.find({userId: userId}).populate('userId', 'username');
    res.json({content});
  }
  catch (error) {
    res.status(500).json({
      message: "Internal server error"
    })
  }
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
    const existingLink = await linkModel.findOne({
      // @ts-ignore
      userId: req.userId
    })
    if(existingLink){
      res.json({
        hash: existingLink.hash
      })
      return;
    }
    const hash = randomHash(10);
    await linkModel.create({
      hash: hash,
      //@ts-ignore
      userId: req.userId
    })
    res.json({
      json,
    })
  } else {
    await linkModel.deleteOne({
      //@ts-ignore
      userId: req.userId
    })
    res.json({
      message: "Removed Link"
    })
  }
  
})

app.get('/api/v1/content/stack/:shareLink', userMiddleware, async (req,res)=>{
  const hash = req.params.shareLink;
  const link = await linkModel.findOne({
    hash
  })
  if(!link){
    res.status(404).json({
      message: "Link not found"
    })
    return;
  }
  const content = await contentModel.find({
    userId: link.userId
  })

  const user = await userModel.findOne({
    _id: link.userId
  })
  if(!user){
    res.status(404).json({
      message: "User not found"
    })
    return;
  }
  res.json({
    username: user.username,
    content: content
  })
})


app.listen(3000);