import Groq from 'groq-sdk';
import "dotenv/config";
import { webSearch } from './tools/websearch.js';
import { ragQuery } from './tools/rag.js';
import NodeCache from 'node-cache';
console.log("welcome to genai");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const Cache = new NodeCache({stdTTL:60*60*24})

export async function generate(usermessage, threadId, onChunk) {
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
    let messages = Cache.get(threadId) ?? baseMessages;

  messages.push({
    role: "user",
    content: usermessage,
  });

  while (true) {
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      messages,
      stream: true,
      tool_choice: "auto",
      tools: [
        {
          type: "function",
          function: {
            name: "webSearch",
            description: "Search internet",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string" },
              },
              required: ["query"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "ragQuery",
            description: "Query internal KB",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string" },
              },
              required: ["query"],
            },
          },
        },
      ],
    });

    let toolCalls = [];

    // Read streaming chunks
      for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta;

      // SEND ONLY ONE CLEANED VERSION
     if (delta?.content) {
   onChunk(delta.content);
}

      if (delta?.tool_calls) {
        toolCalls = delta.tool_calls;
      }
    }
    // If tool calls detected → add to history
    if (toolCalls.length > 0) {
      messages.push({
        role: "assistant",
        tool_calls: toolCalls,
      });
    }

    // If no tool calls → answer is complete
    if (!toolCalls || toolCalls.length === 0) {
      Cache.set(threadId, messages);
      return; 
    }

    // Execute tools
    for (const tool of toolCalls) {
      const functionName = tool.function.name;
      const args = JSON.parse(tool.function.arguments);

      let result = "";

      if (functionName === "webSearch") {
        result = await webSearch(args);
      }

      if (functionName === "ragQuery") {
        result = await ragQuery(args);
      }

      messages.push({
        role: "tool",
        tool_call_id: tool.id,
        name: functionName,
        content: result,
      });
    }
  }
}