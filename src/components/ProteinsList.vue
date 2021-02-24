<template>
<div>
<p>
Filtered proteins list ({{filterPoints.length}})
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