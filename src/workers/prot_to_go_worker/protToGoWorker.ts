const ctx: Worker = self as any; 

addEventListener("message", async event => {
    console.log("protToGoWorker receive message")
    console.log(event.data)
    ctx.postMessage("coucou"); 
})