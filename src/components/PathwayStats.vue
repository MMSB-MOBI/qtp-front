<template>
<div class="datatable">
    <Button label="Compute pathways significance" :disabled="computationLaunched && !refresh" @click="launchComputation"/>
    <div v-if="computationLaunched && !refresh" class="bg-gray-100">
        <Loader v-if="!resultsLoaded" message="ORA under computation..."/>
        <div v-if="resultsLoaded">
            <div v-if="Object.keys(ORAResultsList).length === 0"> No GO terms with significative p-value {{pvalue}} </div>
            <div v-else> 
                <DataTable :value="ORAResultsList" class="datatable p-datatable-sm h-full" sortField="pvalue" :sortOrder="1" :scrollable="true" scrollHeight="500px" v-model:selection="selectedRow" selectionMode="multiple" :metaKeySelection="false"
                @rowSelect="clickRow" @rowUnselect="clickRow">
                    <template #header>
                        <p class="text-lg">{{ORAResultsList.length}} GO terms with p-value &lt; {{pvalue}} </p>
                    </template>
                    <Column field="go" header="GO Term" :sortable="true"/>
                    <Column field="name" header="Name" :sortable="true"/>
                    <Column field="pvalue" header="P-value" :sortable="true"/>
                    <Column field="ns" header="NS" :sortable="true"/>
                </DataTable>
            </div>
        </div>
    </div>
</div>
</template>

<script lang="ts">

import { defineComponent, ref, PropType, onMounted, onUpdated, Ref, toRefs, watch } from 'vue'; 
import { useStore } from 'vuex';

import { PwasAPIInput } from '../types/ora'

import Loader from '@/components/global/Loader.vue'; 
import Button from 'primevue/button';
import DataTable from 'primevue/datatable'; 
import Column from 'primevue/column';


export default defineComponent({

    components : { Loader, Button, DataTable, Column }, 

    props: {
        taxid: {
            type : Number as PropType<number>,
            default: 0
        }, 
        selectedProts: {
            type: Array as PropType<string[]>,
            default:[]
        },
        allProts : {
            type : Array as PropType<string[]>, 
            default:[]
        }, 
        refresh : {
            type: Boolean as PropType<boolean>,
            default: false
        }
    },

    setup(props, { emit }){

        const resultsLoaded = ref(false); 
        const computationLaunched = ref(false); 
        const ORAResultsList: Ref<any[]> = ref([]); //TO DO TYPING
        const pvalue = 0.1
        const method = "fisher"; 
        const selectedRow: Ref<any[]> = ref([]); 
        const refresh = toRefs(props).refresh


        const launchComputation = async () => {
            resultsLoaded.value = false; 
            computationLaunched.value = true; 
            //refresh.value = false; 
            emit('disable-go')
            const apiInput: PwasAPIInput = {
                proteinsExp : props.allProts,
                proteinsDelta : props.selectedProts, 
                method: method, 
                taxid: props.taxid, 
                pvalue: pvalue
            }
            console.log("oraInput", apiInput); 
            fetch(`/api/pwas/ora`, {
                method: 'POST',
                body: JSON.stringify(apiInput),
                headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }}).then(async (response) => {
                const responseData = await response.json()
                ORAResultsList.value = fuseResultsList(responseData)
                resultsLoaded.value = true; 
            }) 
        }

        const closeResults = () => {
            console.log("close")
            computationLaunched.value = false; 
            resultsLoaded.value = false; 
            emit('enable-volcano')
        }

        const clickRow = () => {
            emit('click-on-go', selectedRow.value.map(row => row.go))
        }

        const fuseResultsList = (data:any): any[] => {

            let fused:any[] = []; 
            Object.values(data).forEach((val:any) => {
                fused = [...fused, ...val["list"]]
            })
            return fused; 

        }

        //watch(refresh, (newData) => {
        //    console.log("watch refresh", newData); 
        //    computationLaunched.value = false; 
        //})
        
    
    return { launchComputation, resultsLoaded, computationLaunched, closeResults, ORAResultsList, pvalue, selectedRow, clickRow}

    }

})

</script>

<style>
.close{
  cursor: pointer;
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.datatable{
    height:500px; 
}

</style>