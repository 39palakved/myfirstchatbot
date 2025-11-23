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
app.post("/chat-stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const { message, threadId } = req.body;

  await generate(message, threadId, (chunk) => {
    res.write(`data: ${chunk}\n\n`);
  });

  res.end();
});
app.listen(port,()=>{
    console.log("App running at port 3000")
})