/* eslint-disable */

import {GOIndexed, PointData, GOData, GOObject} from '../types/volcano';

const ctx: Worker = self as any; 

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

const sortAndFlat = (hashmap: GOIndexed) => {
    const sortedList: GOObject[] = []
    Object.keys(hashmap)
        .sort((a:string,b:string) => hashmap[b].proteins.length - hashmap[a].proteins.length)
        .forEach(go_id => sortedList.push(hashmap[go_id]))

    return sortedList; 
}

addEventListener("message", async event => {
    const data = event.data as PointData[]
    const goData:GOIndexed = {}
    data.forEach((point: PointData) => {
        point.unigoGO.forEach((go) => {
            if(!(go.go in goData)) goData[go.go] = {go, proteins:[]}
            goData[go.go].proteins.push(point.id); 
        })
    })
    const sortedData = sortAndFlat(goData); 
    console.log("sortedData", sortedData)

    ctx.postMessage(sortedData); 
})