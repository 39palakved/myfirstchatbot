import Groq from 'groq-sdk';
import "dotenv/config";
import { tavily } from '@tavily/core';
import NodeCache from 'node-cache';
console.log("welcome to genai");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const Cache = new NodeCache({stdTTL:60*60*24}) // for 24 hours after 24 hours data will be deleted

export async function generate(usermessage, threadId) {
    const baseMessages = [
        {
            role: "system",
          content: `
You are a smart personal assistant and an expert in using tools.
You MUST strictly adhere to the required tool call format.
When you need to use a tool, you must ONLY respond with the tool call object.
DO NOT include any conversational filler, plaintext, or Markdown wrappers (like \`\`\`) in the tool call message.
Crucially, after receiving the tool's output, your **NEXT** response must be the final, helpful, conversational answer to the user's request. **You must not call the tool again** unless the user asks a new question that requires a search.
Your only available tool is:
1. webSearch({query}) - Search latest information on the internet.
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
        }
    }
}


async function webSearch({ query }) {
    console.log("Calling Tavily with:", query);

    const response = await tvly.search(query);
    const result = response.results
        .map(r => r.content)
        .join("\n\n");

    return result || "No results found.";
}
