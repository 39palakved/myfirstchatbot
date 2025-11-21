import express from 'express'
import { generate } from './toolscalling.js';
import cors from 'cors'
const app = express();
const port = 3000;
app.use(express.json())
app.use(cors())
app.get('/',(req,res)=>{
    res.send('Welcome to chatdpt!')
})
app.post('/chat',async(req,res)=>{
  const {message , threadId} = req.body;
  //todo: validate above fields

   if(!message || ! threadId){
     return res.status(400).json({message:"All fields are required"})
   }
  const result = await generate(message, threadId)
  res.json({message:result})



})
app.listen(port,()=>{
    console.log("App running at port 3000")
})