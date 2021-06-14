<template>
<div>
  <Loader v-if="!uniprotLoaded && !uniprotError" message="Uniprot data are loading..."/>
  <Error v-if="uniprotError" message="Can't retrieve uniprot data"/>
  <Warning v-if="!taxid && !uniprotError && uniprotLoaded" message="More than 1 taxid in your protein data. Impossible to compute ORA."/>
      <!--<Listbox v-model="selected" :options="availableData" :multiple="true" :filter="true" filterPlaceholder="Search" listStyle="max-height:250px" optionLabel="name">
      <template #header>
        <p class="pl-3 pt-3 text-xl font-semibold"> Choose data records to display (x and y axes) </p>
      </template>
      </Listbox>
      <Button class="w-full mt-2" label="Plot" :disabled="!canDraw" @click="draw"/>-->
    <AddPlot :data="availableData" @new-plot="drawNewPlot"/>
    <div v-for="(plotData, key) in plotsData" :key="key">
      {{plotData.xLabel}}
      {{plotData.yLabel}}
      <Volcano :data="plotData" :taxid="taxid" :plotNumber="key"/>
    </div> 
    <!--<div>
        <OpenableWarnMessage class="mt-2" v-if="volcanoDrawed && nanProt.length >= 1" :header="nanProt.length + ' proteins with no data'" :contentTab="nanProt" content="These proteins don't have data : "/>
        <div class="flex">
          <Volcano 
              :data="plotData" 
              :taxid="taxid"
              @volcano-drawed="volcanoDrawed=true"
              @prot-selection-change="saveSelectedProtId"/>
        </div>
    </div>
  <ComputeORA v-if="volcanoDrawed && taxid"
          @disable-volcano="volcanoDisabled=true"
          @enable-volcano="volcanoDisabled=false"
          :taxid="taxid"
          :selectedProts="selectedProts"
          />-->
</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, Ref, reactive, onMounted, ComputedRef } from 'vue';
import { useStore, mapGetters } from 'vuex'
//import Sliders from '@/components/Sliders.vue';
import Volcano from '@/components/Volcano.vue';
import ProteinsList from '@/components/ProteinsList.vue';
import GoList from '@/components/GoList.vue'; 
import Error from '@/components/global/Error.vue'; 
import Loader from '@/components/global/Loader.vue'; 
import Warning from '@/components/global/Warning.vue'; 
import ComputeORA from '@/components/ComputeORA.vue'
import Listbox from 'primevue/listbox';
import Button from 'primevue/button';
import OpenableWarnMessage from '@/components/global/OpenableWarnMessage.vue'
import AddPlot from '@/components/AddPlot.vue'


import { toggle } from '../utilities/Arrays';
//import protToGoWorker from '@/workers/prot_to_go_worker'; 
import { logDB } from '../utilities/uniprot-storage';
const UniprotDatabase = logDB(); 
import * as t from '../types/volcano';

export default defineComponent({


  components: { /*Sliders,*/ Volcano, ProteinsList, GoList, Error, Loader, ComputeORA, Warning, Listbox, Button, OpenableWarnMessage, AddPlot },

  setup() {

    const uniprotLoaded = ref(false); 
    const uniprotError = ref(false);

    const store = useStore();
    const plotData: t.PlotData = reactive({xLabel : '', yLabel: '', points: []}) 

    const plotsData: Ref<t.PlotData[]> = ref([])

    const transformation = ref("none"); 


    const volcanoDrawed = ref(false); 
    const volcanoDisabled = ref(false); 

    const selectable = computed( () => store.getters.getActiveSheet != null );
    const selected: Ref<t.SelectionInterface[]> = ref([]);
    const select = (field: string) => {
          const _ = toggle(selected.value, field);
          selected.value = _.length <= 2 ? _ : _.slice(-2) ;
        };

    //const isSelected = (field: string) => selected.value.includes(field);

    const availableData: ComputedRef<t.SelectionInterface[]> = computed( () => store.getters.getSelectedHeaders.map((header:string) => { return { name : header }}));
    const canDraw = computed(() => selected.value.length === 2);

    let uniprotData: t.PointData[] = [];
    const taxidWarning: Ref<Set<number>> = ref(new Set()); 
    const taxid: Ref<number> = ref(0); 
    const selectedProts : Ref<string[]> = ref([]); 

    const nanProt: Ref<String[]> = ref([])
    
    const draw = () => {
      if(canDraw.value) {
        volcanoDisabled.value = false; 
        //console.log("lets draw");
        ////console.log(canDraw.value);
        const x_list = store.getters.getColDataByName(selected.value[0].name, 'number')
        const y_list = store.getters.getColDataByName(selected.value[1].name, 'number')
        
        const points = x_list.map((e: number, i: number) => ({
                x:e, 
                y: y_list[i], // aka 'none'
                d: uniprotData[i]
          }))

        nanProt.value = points.filter((point: t.Points) => isNaN(point.x)).map((point : t.Points) => point.d.id); 

        plotData.xLabel = selected.value[0].name;
        plotData.yLabel = selected.value[1].name;
        plotData.points = points.filter((point: t.Points) => !isNaN(point.x));; 


      }
    }

    const drawTest = (xAxis : string, yAxis: string) => {

      //TO DO : HANDLE ALL NaN STUFF

      const x_list = store.getters.getColDataByName(xAxis, 'number')
      const y_list = store.getters.getColDataByName(yAxis, 'number')
      const points: t.Points[] = x_list.map((e: number, i: number) => ({
                x:e, 
                y: y_list[i],
                d: uniprotData[i]
      }))
      //nanProt.value = points.filter((point: t.Points) => isNaN(point.x)).map((point : t.Points) => point.d.id); 
      const newPlotData = {xLabel : xAxis, yLabel: yAxis, points : points.filter(point => !(isNaN(point.x)|| isNaN(point.y)))}
      console.log("data", newPlotData); 
      plotsData.value.push(newPlotData); 

    }

    const getProtData = async (): Promise<t.PointData[]> => {      
      const getDataPromise = (acc: string): Promise<t.PointData> => {
        return new Promise((resolve, reject) => {
          UniprotDatabase.get(acc).then((data) => resolve(data)).catch((error) => reject(error))
        })
      }

      const accessions = store.getters.getColDataByName("Accession", "string");
      return await Promise.all(accessions.map((acc: string) => getDataPromise(acc)))
    }

    const checkTaxidProtData = async (): Promise<Set<number>> => {
      return new Promise((resolve, reject) => {
        const setTaxid: Set<number> = new Set();
        uniprotData.forEach(prot => {
          setTaxid.add(Number(prot.taxid))
        }) 

        if (setTaxid.size === 1) resolve(setTaxid)
        else reject(setTaxid)
      })
    }

    const saveSelectedProtId = (protData: t.Points[]) => {
      selectedProts.value = protData.map(prot => prot.d.id); 
    }

    const drawNewPlot = (xAxis: string, yAxis: string) => {
      drawTest(xAxis, yAxis)
    }

   onMounted(() => {
        console.log("DataExplore onMounted")
        // the DOM element will be assigned to the ref after initial render
        ////console.log(svgRoot.value) // <div>This is a root element</div>

        getProtData()
          .then((values) => {
            console.log("prot data loaded")
            uniprotData = values
            checkTaxidProtData()
              .then((taxids_resp: Set<number>) => {
                taxid.value = Array.from(taxids_resp)[0]
                uniprotLoaded.value = true
                console.log(taxid.value); 
              })
              .catch((taxids_resp: Set<number>) => {
                taxidWarning.value = taxids_resp; 
              })

            

          })
          .catch(reason => {
            uniprotError.value = true; 
            console.error("can't retrieve uniprot data", reason)
          })
        
    });

    return {canDraw, draw, availableData, selectable, selected, select, plotData, transformation, uniprotLoaded, uniprotError, volcanoDisabled, volcanoDrawed, taxidWarning, taxid, saveSelectedProtId, selectedProts, nanProt, drawNewPlot, plotsData} ;
  }


})
</script>

<style scoped>
.active {
  background-color : orange;
}

.disabled{
    z-index:2; 
    position:absolute; 
    width:100%;
    height:100%;
    background-color:black;
    opacity:0.7;  
}

</style>