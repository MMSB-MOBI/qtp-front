<template>
  <h1 class="text-center m-4 text-5xl font-semibold"> QTP </h1>
  <TabView>
    <TabPanel header="Data"> 
      <DataSpreadSheet/>
    </TabPanel>
    <TabPanel header="Explore" :disabled="!xlsDisplayed">
      <DataExplore v-if="xlsDisplayed"/>
    </TabPanel>
  </TabView>
</template>

<script lang="ts">
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import DataSpreadSheet from '@/views/DataSpreadSheet.vue'
import DataExplore from '@/views/DataExplore.vue'
import { defineComponent } from '@vue/runtime-core';
import { useStore } from 'vuex'
import { computed } from 'vue'
export default defineComponent({
  components : { TabView, TabPanel, DataSpreadSheet, DataExplore},
  setup(){
    const store = useStore()
    const xlsDisplayed = computed(() => store.state.states.xlsDisplayed)

    return { xlsDisplayed }

  }
})
</script>

<style>

</style>