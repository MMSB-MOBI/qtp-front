<template>
<div class="relative">
    <div v-if="disabled" class="disabled"/>
    <Listbox v-model="goSelection" :options="formattedToDisplay" :multiple="true" @change="clickSelection" listStyle="height:500px" :filter="true" :filterFields="filterFields">
        <template #header>
            <div class="font-bold p-2">
                Selected GO ({{ go.length }})
            </div>
        </template>
        <template #option="slotProps">
        <div>
            <span>{{slotProps.option.id}} : {{slotProps.option.name}}</span>
        </div>
        </template>
    </Listbox>
</div>
</template>


<script lang="ts">
import { defineComponent, PropType, ref, Ref, toRefs, computed } from 'vue';
import { GOObject } from '../types/volcano';

import Loader from '@/components/global/Loader.vue'
import Listbox from 'primevue/listbox'

interface GOSelectionInterface{
    id: string, 
    name: string, 
    prots: string[]
}

export default defineComponent({
    components : { Loader, Listbox }, 

    props: {
        go: {
            type : Object as PropType<GOObject[]>, 
            default : []
        },
        disabled: {
            type: Boolean as PropType<boolean>, 
            default: false
        }
    }, 

    setup(props, {emit}){
        const goSelection: Ref<GOSelectionInterface[]> = ref([]); 
        const go = toRefs(props).go
        const filterFields = ["id", "name"]

        const formattedToDisplay = computed(() => {
            return go.value.map(goElmt => ({id:goElmt.go.go, name:goElmt.go.name, prots: goElmt.proteins}))
        })

        const clickSelection = () => {
            emit("click-on-go", goSelection.value.map(go => go.id)); 
        }

        return {clickSelection, goSelection, formattedToDisplay, filterFields}
    }
    
    
})
</script>

<style scoped>
.disabled{
    z-index:2; 
    position:absolute; 
    width:100%;
    height:100%;
    background-color:black;
    opacity:0.7;  
}

</style>