const input = document.querySelector('#input')
const chatContainer = document.querySelector('#chat-container')
const askBtn = document.querySelector('#ask')
input.addEventListener('keyup', handleEnter)
askBtn.addEventListener('click', handleAsk)
const threadId = "vbc"

const loading = document.createElement('div');
loading.className = 'my-6 animate-pulse'
loading.textContent = 'Thinking...'


async function generate(text) {
  /** UI: user message */
  const msg = document.createElement('div')
  msg.className = `my-6 bg-neutral-800 p-3 rounded-xl ml-auto max-w-fit`
  msg.textContent = text
  chatContainer?.appendChild(msg);
  input.value = '';

  /** Loading */
  chatContainer.appendChild(loading)

  /** Get streaming response */
  await callServerStream(text)
}

async function callServerStream(inputText) {

  const response = await fetch("http://localhost:3000/chat-stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ threadId, message: inputText })
  });

  // ---- STREAM READER ----
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let assistantDiv = document.createElement("div");
  assistantDiv.className = "max-w-fit";
  assistantDiv.textContent = "";
  chatContainer.appendChild(assistantDiv);

  loading.remove();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n\n");

   for (let line of lines) {
        if (!line.startsWith("data:")) continue;

        const data = line.replace("data: ", "");

        if (data === "[DONE]") {
            return;
        }

      
        assistantDiv.textContent += data;
    }
  }
}


function handleAsk() {
  const text = input.value.trim()
  if (text) generate(text)
}

function handleEnter(e) {
  if (e.key === 'Enter') {
    const text = input.value.trim()
    if (text) generate(text)
  }
}
