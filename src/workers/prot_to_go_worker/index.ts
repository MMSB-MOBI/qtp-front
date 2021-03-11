const worker = new Worker('./protToGoWorker.ts', {type: 'module'})

const send = (message:any) => worker.postMessage({message})

export default { worker, send }