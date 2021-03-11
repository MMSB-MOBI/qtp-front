/* eslint-disable */

import {PointData, GOData} from '../utilities/models/volcano';

interface GOIndexed{
    [go_id: string] : GOObject
}

interface GOObject{
    go: GOData
    proteins: string[]
}

const ctx: Worker = self as any; 

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

addEventListener("message", async event => {
    console.log("protToGoWorker receive message")

    const goData:GOIndexed = {}

    event.data.forEach( (prot: PointData) => {
        prot.GO.forEach((go: GOData) => {
            if(!(go.id in goData)) goData[go.id] = {go, proteins:[]}
            goData[go.id].proteins.push(prot.id)
        }); 
    })

    await sleep(20000); 

    ctx.postMessage(goData); 
})