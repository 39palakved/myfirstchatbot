console.log("welcome to genai");
import "dotenv/config";
import  OpenAI from "openai";
// const client =new OpenAI({
//     apiKey:process.env.GROQ_API_KEY,
//     baseURL:"https://api.groq.com/openai/v1"
// });
// const response = await client.responses.create({
//     model:"openai/gpt-oss-20b",
//     input:"Explain the importance of fast language models"
// })
// console.log(response.output_text);
import Groq from 'groq-sdk'
const groq = new Groq({apiKey:process.env.GROQ_API_KEY})

async function main(){

     const completion = await groq.chat.completions.create({
     
        temperature:1,
        //top_p:1,
        stop:'ga',
        max_completion_tokens:1000,
        frequency_penalty:1,
        presence_penalty:1,
        
        model:"llama-3.3-70b-versatile",
        messages:[
            {
               role:'system' ,
               content:`You are Jarvis, a smart assistant. your task is to check answer of asked questions. and generate response.Give response in onw line`
            },
            {
            role: 'user',
            content:`what is capital of India?`
             
        }]
     })
     console.log(completion.choices[0].message.content);
}
main();

