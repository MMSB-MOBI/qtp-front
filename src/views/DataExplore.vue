<template>
<div>
  <Loader v-if="!uniprotLoaded && !uniprotError" message="Uniprot data are loading..."/>
  <Error v-if="uniprotError" message="Can't retrieve uniprot data"/>
  <Warning v-if="!taxid && !uniprotError && uniprotLoaded" message="More than 1 taxid in your protein data. Impossible to compute ORA."/>
  <div class="relative">
      <div v-if="volcanoDisabled" class="disabled"/>
      <div v-if="uniprotLoaded">
        <h1>This is a Plot!!</h1>
        Choose data records 
        <button v-if="canDraw"
        class="p-1 rounded bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50"
        @click="draw()"
        >PLOT IT</button>
        <div v-if="selectable" class="overflow-y-scroll max-h-24 bg-gray-300">
          <div 
          v-for="column in availableData" 
          :key="column" 
          v-text="column"
          @click="select(column)"
          :class="{ active: isSelected(column) }"
          ></div>
        </div>
        <div>
          <Volcano 
            :data="plotData" 
            @volcano-drawed="volcanoDrawed=true"
            @prot-selection-change="saveSelectedProtId"/>
        </div>
    </div>
  </div>
  <ComputeORA v-if="volcanoDrawed && taxid"
          @disable-volcano="volcanoDisabled=true"
          @enable-volcano="volcanoDisabled=false"
          :taxid="taxid"
          :selectedProts="selectedProts"
          />
</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, Ref, reactive, onMounted, onUnmounted, onUpdated } from 'vue';
import { useStore, mapGetters } from 'vuex'
//import Sliders from '@/components/Sliders.vue';
import Volcano from '@/components/Volcano.vue';
import ProteinsList from '@/components/ProteinsList.vue';
import GoList from '@/components/GoList.vue'; 
import Error from '@/components/global/Error.vue'; 
import Loader from '@/components/global/Loader.vue'; 
import Warning from '@/components/global/Warning.vue'; 
import ComputeORA from '@/components/ComputeORA.vue'
import { toggle } from '../utilities/Arrays';
//import protToGoWorker from '@/workers/prot_to_go_worker'; 
import { logDB } from '../utilities/uniprot-storage';
const UniprotDatabase = logDB(); 
import * as t from '../types/volcano';
export default defineComponent({


  components: { /*Sliders,*/ Volcano, ProteinsList, GoList, Error, Loader, ComputeORA, Warning },

  setup() {

    const uniprotLoaded = ref(false); 
    const uniprotError = ref(false);

    const store = useStore();
    const plotData: t.PlotData = reactive({xLabel : '', yLabel: '', points: []}) 

    const transformation = ref("none"); 


    const volcanoDrawed = ref(false); 
    const volcanoDisabled = ref(false); 

    const selectable = computed( () => store.getters.getActiveSheet != null );
    const selected = ref(new Array<string>());
    const select = (field: string) => {
          const _ = toggle(selected.value, field);
          selected.value = _.length <= 2 ? _ : _.slice(-2) ;
        };

    const isSelected = (field: string) => selected.value.includes(field);

    const availableData = computed( () => store.getters.getSelectedHeaders);

    const canDraw = computed(() => selected.value.length === 2);

    let uniprotData: t.PointData[] = [];
    const taxidWarning: Ref<Set<number>> = ref(new Set()); 
    const taxid: Ref<number> = ref(0); 
    const selectedProts : Ref<string[]> = ref([]); 
    
    const draw = () => {
      if(canDraw.value) {
        volcanoDisabled.value = false; 
        //console.log("lets draw");
        ////console.log(canDraw.value);
        const x_list = store.getters.getColDataByName(selected.value[0], 'number')
        const y_list = store.getters.getColDataByName(selected.value[1], 'number')
        
        const points = x_list.map((e: number, i: number) => ({
                x:e, 
                y: y_list[i], // aka 'none'
                d: uniprotData[i]
          }))
          .filter((point: t.Points) => !isNaN(point.x));

        plotData.xLabel = selected.value[0];
        plotData.yLabel = selected.value[1];
        plotData.points = points; 


      }
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

    return {canDraw, draw, availableData, selectable, selected, select, isSelected, plotData, transformation, uniprotLoaded, uniprotError, volcanoDisabled, volcanoDrawed, taxidWarning, taxid, saveSelectedProtId, selectedProts} ;
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