<template>
<div>
    GO LIST ({{Object.keys(go_data).length}})
    <div class="list overflow-scroll">
        <ul>
            <li 
            class="hover:bg-light cursor-pointer" 
            v-for="go_obj in go_data" 
            :key="go_obj.go.id"
            @click="clickSelection(go_obj.go.id)"
            :class="{ 'bg-light': go_selection.includes(go_obj.go.id) }">
                {{go_obj.go.id}} {{go_obj.go.term}} ({{go_obj.proteins.length}})
            </li>
        </ul>
    </div>
</div>
</template>


<script lang="ts">
import { defineComponent, PropType, ref, Ref } from 'vue';
import { GOIndexed, Points} from '../utilities/models/volcano';
import { useStore } from 'vuex'

export default defineComponent({

    props: {
        data:{
            type: Object as PropType<GOIndexed>,
            default: ''
        }
    },

    setup(props){
        const go_data = props.data; 
        const go_selection: Ref<string[]> = ref([]); 
        const store = useStore(); 


        const clickSelection = (go: string) => {
            console.log("clickSelection")
            if (go_selection.value.includes(go)) go_selection.value = go_selection.value.filter(go_select => go_select !== go)
            else go_selection.value.push(go)

            const filterPredicate = (point: Points): boolean => {
                const go_point = point.d.GO.map(go => go.id)
                const intersect = go_selection.value.filter(go_id => go_point.includes(go_id))
                if (intersect.length === 0) return false
                else return true
            }

            store.commit("proteinSelection/filterHighlight", filterPredicate); 
            console.log(store.state.proteinSelection.coloredSvg); 

        }

        return {go_data, clickSelection, go_selection}
    }
    
    
})
</script>

<style scoped>
.list{
    height:500px;
    overflow-y:auto; 
}

</style>