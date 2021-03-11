<template>
  <Loader v-if="!uniprotLoaded && !uniprotError" message="Uniprot data are loading..."/>
  <Error v-if="uniprotError" message="Can't retrieve uniprot data"/>
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
      <div class="flex p-2 gap-2">
        <button v-if="graphDrawed && transformation !== 'none'" class ="bg-purple-500 h-10 p-2" @click="transformation = 'none'" > Raw data </button>
        <button v-if="graphDrawed && transformation !== '-log10'" class ="bg-purple-500 h-10 p-2" @click="transformation = '-log10'"> - Log10 transformation </button>
        <button v-if="graphDrawed && transformation !== 'log10'" class ="bg-purple-500 h-10 p-2" @click="transformation = 'log10'"> Log10 transformation </button>
      </div>
    <div class="flex gap-10">
      <Volcano 
        :data="plotData" :transformy="transformation" 
        @volcano-loaded-draw="graphDrawed = true"
        @volcano-empty-draw="graphDrawed = false"/>
      <ProteinsList v-if="graphDrawed"/>
      <GoList v-if="goLoaded && graphDrawed"/>
      <Loader v-if="!goLoaded && graphDrawed" message="GO data are loading..."/>
    <!-- <Volcano height=500 width=500/> -->
    </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, Ref, reactive, onMounted, onUnmounted } from 'vue';
import { useStore, mapGetters } from 'vuex'
//import Sliders from '@/components/Sliders.vue';
import Volcano from '@/components/Volcano.vue';
import ProteinsList from '@/components/ProteinsList.vue';
import GoList from '@/components/GoList.vue'; 
import Error from '@/components/global/Error.vue'; 
import Loader from '@/components/global/Loader.vue'; 
import { plotData  as plotDataType, transform} from '../utilities/models/volcano';
import { toggle } from '../utilities/Arrays';
//import protToGoWorker from '@/workers/prot_to_go_worker'; 
import { UniprotDatabase } from '../utilities/uniprot-database';
import * as t from '../utilities/models/volcano';
export default defineComponent({


  components: { /*Sliders,*/ Volcano, ProteinsList, GoList, Error, Loader },

  setup() {

    const uniprotLoaded = ref(false); 
    const uniprotError = ref(false);
    const goLoaded = ref(false);

    const store = useStore();
    const plotData = reactive({
      d: new Array<t.PointData>(),
      x: new Array<number>(),
      y: new Array<number>(),
      xLabel:'',
      yLabel:''
    } as plotDataType);

    const transformation = ref("none"); 
    const graphDrawed = ref(false); 

    const selectable = computed( () => store.getters.getActiveSheet != null );
    const selected = ref(new Array<string>());
    const select = (field: string) => {
          const _ = toggle(selected.value, field);
          selected.value = _.length <= 2 ? _ : _.slice(-2) ;
        };
    const isSelected = (field: string) => selected.value.includes(field);

    const availableData = computed( () => store.getters.getSelectedHeaders);

    const canDraw = computed(() => selected.value.length === 2);

    let uniprotData: t.PointData[] = []; //TO DO : type
    const protToGoWorker = new Worker('@/workers/protToGoWorker.ts', {type: 'module'})

    
    
    const draw = () => {
      if(canDraw.value) {
        //console.log("lets draw");
        ////console.log(canDraw.value);
        plotData.x = store.getters.getColDataByName(selected.value[0], 'number');
        plotData.y = store.getters.getColDataByName(selected.value[1], 'number');
        plotData.xLabel = selected.value[0];
        plotData.yLabel = selected.value[1];

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

   onMounted(() => {
        console.log("DataExplore onMounted")
        // the DOM element will be assigned to the ref after initial render
        ////console.log(svgRoot.value) // <div>This is a root element</div>

        getProtData()
          .then((values) => {
            console.log("prot data loaded")
            uniprotLoaded.value = true
            uniprotData = values
            protToGoWorker.postMessage(uniprotData)

          })
          .catch(reason => {
            uniprotError.value = true; 
            console.error("can't retrieve uniprot data", reason)
          })

        protToGoWorker.onmessage = event => {
          goLoaded.value = true; 
        }

        
    });

    onUnmounted(() => {
      protToGoWorker.terminate()
    })

    return {canDraw, draw, availableData, selectable, selected, select, isSelected, plotData, transformation, graphDrawed, uniprotLoaded, uniprotError, goLoaded};
  }


})
</script>

<style>
.active {
  background-color : orange;
}
</style>