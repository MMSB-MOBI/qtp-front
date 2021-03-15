/* eslint-disable */

import {GOIndexed, PointData, GOData} from '../utilities/models/volcano';

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

    ctx.postMessage(goData); 
})