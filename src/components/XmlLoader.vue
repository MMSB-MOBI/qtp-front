/*
 See tricks : https://learnvue.co/2020/01/how-to-add-drag-and-drop-to-your-vuejs-project/
*/
<template>
   <h1 class="title"> XML Loader II</h1>
   <DragAndDrop 
   @xml-load="doIt"
   />

    <div v-if="!loaded" class="flex gap-5 p-2 pl-4">
        <div class="loader-textdiv">
            <span class=" inline-block align-middle"> Data are loading... </span>
        </div>
        <div class="loader"></div>
   </div>

    <div 
    v-if="loaded"
    >
        <div 
            class="flex flex-col"
        >
            <div class="w-auto bg-light bg-opacity-50 p-3 m-2 mb-3 border-2 border-black border-opacity-100">
                <div
                class="font-semibold mb-2"
                v-for="sTitle in headers"
                :key="sTitle"
                >
                    {{sTitle}}
                </div>
                <p> {{dimensions[0] - 1}} proteins</p>
                <p>
                    {{selectedCol.length}} selected columns for data exploration {{defaultColSelectionStr}}
                </p>
            </div>
        </div>

        <table class="w-auto">
            <thead>
                <tr> 
                    <th 
                    v-for="m in dimensions[1]" 
                    :key="m" 
                    class="checkbox"
                    :style="{ 'background-color': selectedCol.includes(m - 1) ? 'thistle' : ''}"> 
                        <input type="checkbox" @click="addToSelection(m - 1)" :checked="selectedCol.includes(m-1)" /> 
                    </th>
                </tr>
                <tr>
                    <th 
                    class="relative p-2 cell" 
                    v-for="m in dimensions[1]" 
                    :key="m" 
                    :style="{ 'background-color': selectedCol.includes(m - 1) ? 'thistle' : ''}"
                    > 
                        <div class="cell-content-div"
                        :style="{width: savedWidths[m-1] + 'px'}"
                        >
                          
                            <p 
                            class="cell-content cursor-pointer"
                            >
                            
                                {{cell(0,m-1)}}
                            </p>
                    </div>
                    <div class="resize-cursor" @mousedown="resizeOnMouseDown($event, m)"></div>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr
                v-for="n in dimensions[0] - 1"
                :key="n"
                >
                    <td
                    class="relative p-2"
                    v-for="m in dimensions[1]"
                    :key="m"
                    :style="{ 'background-color': selectedCol.includes(m - 1) ? 'thistle' : ''}"
                    >
                        <div class="cell-content-div"
                            >
                            <p 
                            class="cell-content">
                                {{cell(n,m-1)}}
                            </p>
                        </div>
                        <div class="resize-cursor" @mousedown="resizeOnMouseDown($event, m)"></div>
                    </td>
                </tr>
            </tbody>
        </table>
        
        
    </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, onUnmounted, reactive, watch, onBeforeUpdate, onUpdated, Ref } from 'vue';
//import { ref } from 'vue'

import DragAndDrop from '@/components/DragAndDrop.vue';
import XLSX  from 'xlsx';
import { useStore } from 'vuex'

import { UniprotDatabase } from '../utilities/uniprot-database';

export default defineComponent({
    components : { DragAndDrop },
    setup(){
        console.log("OOOO")
        //For resizable tab
        const curCol = ref(0)
        const pageX = ref(0); 

        //const savedWidths: Ref<number[]> = ref([]); 
        //const savedCol = ref(0); 
        //const savedColWidth = ref(0); 

        const loaded = ref(false);
        const defaultColSelectionStr = ref('(default selection : columns with Abundance Ratio)'); 
        const store = useStore()
        const wsHead = computed(()=>{ return store.getters.test})

        

        const doIt = (dropData: any) => {
            //////console.log("Tryin to read ...");
            const workbook = XLSX.read(dropData, {type: 'array'});
            console.log(typeof(workbook)); 
            ////console.dir(workbook)
            store.dispatch('initStoreBook', workbook);
            //////console.log(workbook.SheetNames);
            /*const _ = workbook.SheetNames[0];
            const sheet = workbook.Sheets[_];*/            
            loaded.value = true;             
        };

        const name = computed(() => store.state.count);
        const selectedCol = computed(() => store.state.selectedCol)

        //const active = computed(() => store.state.count);
        const headers = computed( () => {
            ////console.log("HEADERS", store.getters.sheetNames); 
            return  store.getters.sheetNames;
        });
        const dimensions: any = computed( () => {
            return  store.getters.dimensions;
        });

        const savedWidths = ref(Array(dimensions.value[1]).fill(''));

        const cell = (x: number, y: number)=>{
            //const _ = store.getters.cell(x, y)
            return store.getters.cell(x, y);
        };
        const increment = () => {
            store.commit('pushUp');
        };

        const resizeOnMouseDown = (e: any, colNum: number) => {
            curCol.value = colNum; 
            pageX.value = e.pageX; 
            savedWidths.value[colNum - 1] = e.target.previousSibling.offsetWidth; 
            

        }

        const resizeOnMouseMove = (e: any) => {
            if(curCol.value){
                const diffX = e.pageX - pageX.value;  
                savedWidths.value[curCol.value - 1] = savedWidths.value[curCol.value - 1] + diffX; 
                pageX.value = e.pageX; 
            }

        }

        const resizeOnMouseUp = (e: Event) => {
            curCol.value = 0; 
            pageX.value = 0; 
        }

        const addToSelection = (colNum: number) => {
            store.commit('addToSelection', {colNum, remove : true}); 
            defaultColSelectionStr.value = '(manual selection)'; 
        }



        onMounted(()=>{
            ////console.log("mounted xmlLoader"); 
            window.addEventListener('mousemove', resizeOnMouseMove)
            window.addEventListener('mouseup', resizeOnMouseUp)


            setTimeout(async() => {
                //////console.log("trying to fecth")

                
                const arrayData = await fetch(
                    'xls/TMT-donées brutes_Results_20-0609-0618_VegetativeExp_V2_proteins.xlsx'
                    )//'../TMT-donées brutes_Results_20-0609-0618_VegetativeExp_V2_proteins.xlsx')//fetch("../TMT-donées brutes_dev.xlsx")
                    .then( (response) =>{
                        //////console.log(response.status);
                        //////console.log("success");
                    return response.arrayBuffer();
                    })
                    .catch(()=>console.error("No XLS found"));
                if(arrayData) {
                    //////console.log("OUOUH");
                    //////console.log(arrayData); 
                    const data = new Uint8Array(arrayData);
                    const wb = XLSX.read(data, {type:"array"});
                    console.log("TYPE", typeof(wb)); 
                    store.dispatch('initStoreBook', wb);
                    store.dispatch('selectColByKeyword', 'Abundance Ratio'); 
                    loaded.value = true;
                    const uniprotIdList: string[]|undefined = store.getters.getColDataByName("Accession", "string");
                    if (uniprotIdList) {
                        ////console.log(`Trying to load ${uniprotIdList.length} elements`);
                        try{
                            const n = await UniprotDatabase.add(uniprotIdList);
                            console.log(`${n} additions OK`);

                        }catch(e){
                            console.log("ERROR")
                            throw(e);
                        }                       
                        await UniprotDatabase.readAll();
                        const d = await UniprotDatabase.get("P00961");
                        //console.dir(d);
                    }
                    //////console.log(store.getters.json);
                }
            }
            , 1000);
        })

        onUnmounted(() => {
            window.removeEventListener("mousemove", resizeOnMouseMove)
            window.removeEventListener('mouseup', resizeOnMouseUp)
        })
        return { doIt, name, wsHead, increment, loaded, headers, dimensions, cell, resizeOnMouseDown, curCol, pageX, savedWidths, addToSelection, selectedCol, defaultColSelectionStr};
    }
});
</script>

<style>

table, th, td{
    border:1px solid black; 
    background-clip: padding-box;
}

.col-clickable-div{
    height:100%; 
    width:calc(100% - 5px); 
    position:absolute; 
    top:0; 
    left:0; 
    cursor:pointer; 
}

.resize-cursor {
    /*background-color:red;*/
    top: 0; 
    right: 0; 
    width: 5px; 
    position: absolute; 
    cursor: col-resize; 
    user-select:none; 
    height:100%; 
}

.resize-cursor:hover {
    border-right:3px solid #4f304f; 
}

.cell-content {
    min-width:min-content; 
}

.loader,
.loader:after {
  border-radius: 50%;
  width: 5em;
  height: 5em;
}
.loader {
  /*margin: 60px auto;*/
  font-size: 10px;
  position: relative;
  text-indent: -9999em;
  border-top: 0.5em solid rgba(0,0,0, 0.2);
  border-right: 0.5em solid rgba(0,0,0, 0.2);
  border-bottom: 0.5em solid rgba(0,0,0, 0.2);
  border-left: 0.5em solid #000000;
  -webkit-transform: translateZ(0);
  -ms-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-animation: load8 1.1s infinite linear;
  animation: load8 1.1s infinite linear;
}
@-webkit-keyframes load8 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@keyframes load8 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

.loader-textdiv{
    display:flex;
    height:100%; 
    margin:auto 0px; 
}


</style>