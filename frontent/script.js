const input = document.querySelector('#input')
const chatContainer = document.querySelector('#chat-container')
const askBtn = document.querySelector('#ask')
input.addEventListener('keyup', handleEnter)
askBtn.addEventListener('click', handleAsk)
const threadId = "vbc"
const loading = document.createElement('div');
loading.className = 'my-6 animate-pulse'
loading.textContent='Thinking...'


async function generate(text){
  /** append msg to ui */
  /* send it to llm */
  /*Append response to ui */
  const msg = document.createElement('div')
  msg.className = `my-6 bg-neutral-800 p-3 rounded-xl ml-auto max-w-fit`
  msg.textContent = text
  chatContainer?.appendChild(msg);
  input.value='';
  chatContainer.appendChild(loading)
 
  const assistantmsg = await  callServer(text)
  const res = document.createElement('div');
    res.className = `max-w-fit`
    res.textContent = assistantmsg.message
    loading.remove();
    chatContainer?.appendChild(res)
}

async function callServer(inputText){
    const response = await fetch('http://localhost:3000/chat',{
        method:'POST',
        headers:{
            'content-type':'application/json'
        },
        body: JSON.stringify({threadId , message:inputText})
    })
    if(!response.ok) {
      throw new Error("Error generating the response")
    }
    const data  = await response.json();
   return data
    

}
function handleAsk(e){
    const text = input.value.trim()
        if(!text){
            return;
        }
        
        generate(text)

}
function handleEnter(e){
    if(e.key === 'Enter'){
        const text = input.value.trim()
        if(!text){
            return;
        }
        generate(text)
        console.log(text)
    }
    
}
