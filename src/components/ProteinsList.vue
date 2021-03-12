<template>
<div v-if="filterPoints.length" class="list p-2 mr-5 overflow-scroll w-full">
<p class="font-bold mb-1">
Filtered proteins list ({{filterPoints.length}}) :
</p>
<ul>
    <li v-for="point in filterPoints" :key="point">{{point.d.id}} : {{point.d.fullName}} </li>
</ul>
</div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex'

export default defineComponent({
    setup(){
        const store = useStore(); 
        const filterPoints = computed(()=>{ return store.state.proteinSelection.filterPoints})
               
       return {filterPoints}
    }
    
})
</script>

<style>
    .list{
        height:500px; 
        border:solid grey; 
        border-width:1px; 
        border-radius:5px; 
    }
    ::-webkit-scrollbar {
        -webkit-appearance: none;
        width: 7px;
        }
    ::-webkit-scrollbar-thumb {
        border-radius: 4px;
        background-color: rgba(0, 0, 0, .5);        
    }
</style>