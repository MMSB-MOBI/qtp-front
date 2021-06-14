/*
 See tricks : https://learnvue.co/2020/01/how-to-add-drag-and-drop-to-your-vuejs-project/
*/
<template>

   <div class="flex">
       
        <DragAndDrop class="p-3 w-9/10"
        @xml-load="loadDroppedFile"
        @xls-drop="xlsDropped=true"
        />
        <!--<InputFile/>-->
        <Button class="p-button-link w-1/10" @click="loadExample" label="Load example"/>
    </div>
   <Loader class="p-mt-2" v-if="xlsDropped" message="Data are loading..."/>
   <Loader class="p-mt-2" v-if="loaded && !uniprotDBFilled" message="Uniprot data are stored..."/>
    <div v-if="loaded && uniprotDBFilled && !xlsDropped" class="mt-5">
        
        <div class="border border-primary p-3">
            <div
                class="font-semibold mb-2"
                v-for="sTitle in headers"
                :key="sTitle"
            >
                {{sTitle}}
            </div>
            <p> {{jsonData.length}} proteins</p>
            <p>
                {{selectedColumns.length}} selected columns
            </p>
            </div>

    <DataTable :value="jsonData" :paginator="true" :rows="10" :resizableColumns="true" columnResizeMode="expand" showGridlines responsiveLayout="scroll" paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown" :rowsPerPageOptions="[10,20,50]" currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
    v-model:filters="filters"
    >
        <template #header>
            <div class="p-d-flex p-jc-between p-ai-center">
                <MultiSelect :modelValue="selectedColumns" :options="columns" optionLabel="header" @update:modelValue="onSelection"
                placeholder="Select Columns" :filter="true" class="w-1/2"/>
                <span class="p-input-icon-left">
                    <i class="pi pi-search" />
                    <InputText v-model="filters['global'].value" placeholder="Keyword Search" />
                </span>
            </div>
        </template>
        <Column v-for="(col, index) of selectedColumns" :field="col.field" :header="col.header" :key="col.field + '_' + index"></Column>
    </DataTable>
</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, onUnmounted, reactive, watch, onBeforeUpdate, onUpdated, Ref } from 'vue';
//import { ref } from 'vue'

import DragAndDrop from '@/components/DragAndDrop.vue';
import Loader from '@/components/global/Loader.vue'
import InputFile from '@/components/InputFile.vue'
//import FileUpload from 'primevue/fileupload';
import Button from 'primevue/button'; 
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import MultiSelect from 'primevue/multiselect'; 
import InputText from 'primevue/inputtext';
import {FilterMatchMode} from 'primevue/api';
import XLSX  from 'xlsx';
import { useStore } from 'vuex'

import { logDB } from '../utilities/uniprot-storage';
const UniprotDatabase = logDB(); 
import { range } from '../utilities/basic_functions'

interface ColTemplate{
    field: string; 
    header: string; 
    idx: number; 
}

export default defineComponent({
    components : { DragAndDrop, Loader, InputFile, Button, DataTable, Column, MultiSelect, InputText },
    setup(_, { emit }){
        
        const store = useStore()

        const loaded = ref(false);
        const xlsDropped = ref(false);
        const uniprotDBFilled = ref(false);

        const columns: Ref<ColTemplate[]> = ref([]); //TO DO : typing
        const jsonData = ref([]) // TO DO : typing
        const selectedColumns: Ref<ColTemplate[]> = ref([]); 

        const filters = ref(
            {'global': { value: null, matchMode:FilterMatchMode.CONTAINS }}
        ); 

 

        //const active = computed(() => store.state.count);
        const headers = computed( () => {
            ////console.log("HEADERS", store.getters.sheetNames); 
            return  store.getters.sheetNames;
        });

        const loadDroppedFile = async (dropData: any) => {
            store.commit('states/mutateXlsDisplayed', false)
            xlsDropped.value = true;
            uniprotDBFilled.value = false; 
            loaded.value = false; 
 
            await storeData(dropData); 
        };


        const loadExample = async () => {
            store.commit('states/mutateXlsDisplayed', false)
            xlsDropped.value = true;
            uniprotDBFilled.value = false; 
            loaded.value = false; 
            const arrayData =  await fetch('xls/TMT-donées brutes_Results_20-0609-0618_VegetativeExp_V2_proteins_test.ods')
                .then( (response) => {
                    return response.arrayBuffer(); 
                })
                .catch(() => console.error("No XLS found"))

            if (arrayData){
                const data = new Uint8Array(arrayData);
                await storeData(data); 
                
            }
        }

        const storeInUniprotDatabase = (): Promise<boolean> => {
            console.log("storeInUniprotDatabase")
            return new Promise((res, rej) => {
                const uniprotIdList: string[]|undefined = store.getters.getColDataByName("Accession", "string");
                if (uniprotIdList){
                    UniprotDatabase.add(uniprotIdList)
                        .then(() => res(true))
                        .catch(err => rej(err))
                }
                else rej(Error("Can't fill up uniprot database. No uniprot ids"))
            })
        }

        const onSelection = (val: ColTemplate[]) => {
            console.log("add", val)
            selectedColumns.value = columns.value.filter(col => val.includes(col))
            store.commit('mutateSelectedCols', val.map(col => col.idx))
        }

        const storeData = async (data: any) => {
            const wb = XLSX.read(data, {type:"array"});
                store.dispatch('initStoreBook', wb);
                //store.dispatch('selectColByKeyword', 'Abundance Ratio'); 
                xlsDropped.value = false; 
                loaded.value = true;

                await storeInUniprotDatabase(); 
                uniprotDBFilled.value = true; 

                const headers = store.getters.currentSheetHeaders
                const col: ColTemplate[] = headers.map((header:string, index:number) => {return {field: header.replace(/\./g, ''), header: header, idx: index}})
                columns.value = col
                const _ = store.getters.json
                const _jsonData = [] as any
                _.forEach((row: any) => {
                    let newRow = {} as any
                    Object.keys(row).forEach((key: string) => {
                        const newKey = key.replace(/\./g, ''); 
                        newRow[newKey] = row[key]
                    })
                    _jsonData.push(newRow)
                })
                jsonData.value = _jsonData; 
                const selectedCols = col.filter((colElmt:any) => (colElmt.field.includes('Abundance Ratio') && ! colElmt.field.includes("Variability")) || colElmt.field === "Accession"); 
                
                selectedColumns.value = selectedCols
                store.commit('mutateSelectedCols', selectedCols.map(col => col.idx))
            
                store.commit('states/mutateXlsDisplayed', true)
        }

        return { loadDroppedFile, loadExample, xlsDropped, loaded, uniprotDBFilled, jsonData, selectedColumns, columns, onSelection, headers, filters };
    }
});
</script>

<style scoped>

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

.test{
    width:100%; 
}


</style>