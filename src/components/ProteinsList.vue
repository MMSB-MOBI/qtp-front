<template>
  <div>
    <Listbox v-model="selectedProt" :options="formattedToDisplay" :multiple="true" @change="clickProt" listStyle="height:500px" :filter="true" :filterFields="filterFields">
      <template #header>
        <div class="font-bold p-2">
            Filtered proteins list ({{ points.length }})
        </div>
      </template>
      <template #option="slotProps">
      <div>
        <span>{{slotProps.option.id}} : {{slotProps.option.fullName}} </span>
      </div>
    </template>
    
    </Listbox>
    <!--<Button class="p-button-outlined w-full mt-3" @click="downloadProteins">
      <div class="flex-auto space-x-1">
        <i class="pi pi-download" />
        <span> Download proteins list </span>
      </div>
    </Button>-->
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, PropType, toRefs, computed } from "vue";
import { useStore } from "vuex";
import { toggle } from "../utilities/Arrays";
import { Points } from "../types/volcano";
import Button from "primevue/button";
import Listbox from "primevue/listbox";
import download from "downloadjs";

export default defineComponent({
  components: { Button, Listbox },
  props: {
    points: {
      type: Array as PropType<Points[]>,
      default: [],
    },
  },

  setup(props, { emit }) {
    //ATTRIBUTES
    const store = useStore();
    const selectedProt: Ref<any[]> = ref([]);
    const { points } = toRefs(props);

    const formattedToDisplay = computed(() => {
      return points.value.map(point => ({id : point.d.id, fullName: point.d.fullName}) )
    })

    const filterFields = ["id", "fullName"]



    //METHODS
    const clickProt = (prot_id: string) => {
      console.log("click prot")
      emit("click-on-prot", selectedProt.value.map(p => p.id));
    };

    const downloadProteins = () => {
      let report_str = "#Accession\tFull name\tGene name\tName\n";
      points.value.forEach((point) => {
        report_str =
          report_str +
          `${point.d.id}\t${point.d.fullName}\t${point.d.geneName}\t${point.d.name}\n`;
      });
      download(report_str, `selected_proteins.tsv`, "text/plain");
    };

    return { points, clickProt, selectedProt, downloadProteins, formattedToDisplay, filterFields };
  },
});
</script>

<style scoped>

</style>