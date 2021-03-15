/* eslint-disable */

import {GOIndexed, PointData, GOData} from '../utilities/models/volcano';

const ctx: Worker = self as any; 

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

const sortHash = (hashmap: GOIndexed) => {
    const sorted_hash: GOIndexed = {}
    Object.keys(hashmap)
    .sort((a:string,b:string) => hashmap[b].proteins.length - hashmap[a].proteins.length)
    .forEach(go_id => sorted_hash[go_id] = hashmap[go_id])

    return sorted_hash; 
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


    const sortedData = sortHash(goData)
    console.log("SORTED", sortedData); 

    ctx.postMessage(sortedData); 
})