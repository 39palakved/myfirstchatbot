import Groq from 'groq-sdk';
import "dotenv/config";
import { webSearch } from './tools/websearch.js';
import { ragQuery } from './tools/rag.js';
import NodeCache from 'node-cache';
console.log("welcome to genai");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const Cache = new NodeCache({stdTTL:60*60*24}) // for 24 hours after 24 hours data will be deleted

export async function generate(usermessage, threadId) {
    const baseMessages = [
        {
            role: "system",
          content: `
You are a smart personal assistant and an expert in using tools.
You MUST strictly adhere to the exact tool call JSON format.
When you need to use a tool, respond ONLY with the raw JSON tool call object.
NO conversational text, NO explanations, NO markdown.

AFTER the tool returns output:
You MUST give a final conversational answer.
DO NOT call another tool unless the user asks a new question that requires it.

Your available tools are:

1. webSearch({ query })
   - Use this when the user asks for latest or external internet information.

2. ragQuery({ question })
   - Use this when user asks something that should be answered from local documents,
     vector database, or internal knowledge.

If no tool is relevant, answer directly WITHOUT a tool call.


=====================
 FEW-SHOT EXAMPLES
=====================

Example 1:
User: "Who is the current US President?"

Assistant MUST reply using webSearch:

{
  "tool": "webSearch",
  "query": "current US President"
}

(After tool output arrives)
Assistant: "The current US President is ..."


Example 2:
User: "Explain the concept of ACID properties."

Assistant MUST answer directly (no tool):

Assistant: "ACID properties stand for Atomicity, Consistency, Isolation, Durability..."


Example 3:
User: "Find answer from your stored documents: What is vector embedding?"

Assistant MUST use ragQuery:

{
  "tool": "ragQuery",
  "question": "What is vector embedding?"
}

(After tool output arrives)
Assistant: "Vector embedding means ..."


Example 4:
User: "Search on the internet: best laptops under 70000"

Assistant MUST use webSearch:

{
  "tool": "webSearch",
  "query": "best laptops under 70000 in India"
}

(After tool output arrives)
Assistant: "Here are the best laptops under 70k ..."


Example 5:
User: "Use your internal KB and tell me: what is our refund policy?"

Assistant MUST use ragQuery:

{
  "tool": "ragQuery",
  "question": "refund policy"
}

`
        }
    ];
    const messages= Cache.get(threadId)??baseMessages;
    messages.push({
        role: "user",
        content: usermessage
    });

    while (true) {

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            temperature: 0,
            messages,
            tool_choice: "auto",
            tools: [
                {
                    type: "function",
                    function: {
                        name: "webSearch",
                        description: "Search latest information on the internet",
                        parameters: {
                            type: "object",
                            properties: {
                                query: {
                                    type: "string",
                                    description: "The query to search"
                                }
                            },
                            required: ["query"]
                        }
                    }
                },
                {
                     type: "function",
                     function: {
                        name: "ragQuery",
                        description: "Search information from internal PDF knowledge base using vector similarity",
                        parameters: {
                         type: "object",
                         properties: {
                         query: { type: "string" }
                        },
                     required: ["query"]
            }
        }
                }
            ]
        });

        const msg = completion.choices[0].message;

        messages.push({
            role: msg.role,
            content: msg.content ?? "",
            tool_calls: msg.tool_calls
        });

        const toolCalls = msg.tool_calls;

        
        if (!toolCalls || toolCalls.length === 0) {
            Cache.set(threadId,messages)
            return msg.content;
            
        }

    
        for (const tool of toolCalls) {

            const functionName = tool.function.name;
            const args = JSON.parse(tool.function.arguments);

            if (functionName === "webSearch") {
                const tool_result = await webSearch(args);
               
                
                messages.push({
                    role: "tool",
                    tool_call_id: tool.id,
                    name: functionName,
                    content: tool_result
                });
            }
             if (functionName === "ragQuery") {
               const tool_result = await ragQuery(args);

               messages.push({
               role: "tool",
               tool_call_id: tool.id,
               name: functionName,
               content: tool_result
               });
            }
        }
    }
}



