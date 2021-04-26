<template>
<div class="m-2">
    <button :disabled="computationLaunched"
    class="rounded p-2 bg-purple-300 hover:bg-purple-400 disabled:bg-red-500" 
    @click="launchComputation"> 
        Compute ORA on selected proteins
    </button>

    <span v-if="computationLaunched" class="close hover:text-gray-500" @click="closeResults"> &times; </span>
    
    <div v-if="computationLaunched" class="bg-gray-100">
        <Loader v-if="!resultsLoaded" message="ORA under computation..."/>
        <div v-if="resultsLoaded">
            <div v-if="Object.keys(ORAResultsList).length === 0"> No GO terms with significative p-value (0.5) </div>
            <div v-else> 
                <p class="font-bold">Significative GO terms (p-value > 0.5) : </p>
                
                <table>
                    <tr>
                        <th>GO Term</th>
                        <th>Name</th>
                        <th>P-value</th>
                    </tr>  
                    <tr v-for="v,k in ORAResultsList" :key="k">
                        <td> {{k}} </td>
                        <td> {{v.name}} </td>
                        <td> {{v.pvalue}} </td>
                    </tr>
                     
                </table>
            </div>
        </div>
    </div>
    
</div>
</template>

<script lang="ts">

import { defineComponent, ref, PropType } from 'vue'; 
import { useStore } from 'vuex';

import { PwasAPIInput } from '../types/ora'

import Loader from '@/components/global/Loader.vue'; 

export default defineComponent({

    components : { Loader }, 

    props: {
        taxid: {
            type : Number as PropType<number>,
            default: 0
        }, 
        selectedProts: {
            type: Array as PropType<string[]>,
            default:[]
        }
    },

    setup(props, { emit }){

        const test = ref(false); 
        const resultsLoaded = ref(false); 
        const computationLaunched = ref(false); 
        const ORAResultsList = ref({}); 
        const store = useStore(); 

        const launchComputation = async () => {
            computationLaunched.value = true; 
            emit('disable-volcano')
            
            const method = "fisher"; 
            const expAccessions = store.getters.getColDataByName("Accession", 'string')
        
            const apiInput: PwasAPIInput = {
                proteinsExp : expAccessions,
                proteinsDelta : props.selectedProts, 
                method: method, 
                taxid: props.taxid
            }

            fetch(`/api/pwas/ora`, {
                method: 'POST',
                body: JSON.stringify(apiInput),
                headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }}).then(async (response) => {
                const responseData = await response.json()
                ORAResultsList.value = responseData.list
                resultsLoaded.value = true; 
                console.log("END")
            })
            
            
        }

        const closeResults = () => {
            console.log("close")
            computationLaunched.value = false; 
            resultsLoaded.value = false; 
            emit('enable-volcano')
        }

    
    return { launchComputation, resultsLoaded, computationLaunched, closeResults, ORAResultsList}

    }

})

</script>

<style scoped>
.close{
  cursor: pointer;
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}
</style>