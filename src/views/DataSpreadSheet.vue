<template>
  <div class="root">
   <p class="text-xl font-medium m-2"> Load your data </p>
   <XmlLoader />
   <!--
    <img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/>
   -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
//import HelloWorld from '@/components/HelloWorld.vue'; // @ is an alias to /src
import XmlLoader from '@/components/XmlLoader.vue'; // @ is an alias to /src
export default defineComponent({
  name: 'DataSpreadSheet',
  components: {
    XmlLoader
  //  HelloWorld,
  },
  mounted(){
    //console.log("Mounting spreadsheet");
  }
});
</script>

<style scoped>
.root{
  text-align:center; 
}
</style>
