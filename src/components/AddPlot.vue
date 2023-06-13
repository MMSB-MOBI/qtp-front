<template>
<div>
    <Button label="Add new plot" @click="displayDialog=true"/>
    <Dialog header="Add new plot" :visible="displayDialog" :closable="false">
        <div class="flex gap-5">
            <div>
                <p class="text-lg p-1 pb-2 font-medium"> x axis </p>
                <Dropdown 
                    placeholder="x axis" 
                    v-model="selectedAxis.x" 
                    :options="selectionLists.x" 
                    :filter="true" 
                    optionLabel="name"
                    optionDisabled="anything"
                    @change="axisSelection('x')">
                </Dropdown>
            </div>
            <div>
                <p class="text-lg p-1 pb-2 font-medium"> y axis </p>
                <Dropdown placeholder="y axis" 
                    v-model="selectedAxis.y" 
                    :options="selectionLists.y" 
                    :filter="true"
                    optionLabel="name"
                    optionDisabled="anything"
                    @change="axisSelection('y')">
                </Dropdown>
            </div>
        </div>
        <template #footer>
                    <Button label="No" icon="pi pi-times" @click="closeDialog" class="p-button-text"/>
                    <Button label="Yes" icon="pi pi-check" @click="newPlot" autofocus />
        </template>
    </Dialog>
</div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, PropType, toRefs, computed, ComputedRef, reactive } from "vue";
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import { copyArrayOfObjects } from '../utilities/Arrays';
import { SelectionInterface } from '../types/volcano'; 

type AxisType = "x" | "y"

interface OptionType {
    name : string;
    optionDisabled: boolean;
}

interface AxisSelectionListInterface {
    x:OptionType[]
    y:OptionType[]
}

interface AxisSelectionInterface {
    x:OptionType
    y:OptionType
}


export default defineComponent ({
    components: { Button, Dialog, Dropdown }, 
    props : {
        data: {
            type: Array as PropType<SelectionInterface[]>,
            default : []
        }
    }, 
    setup(props : any, {emit}){
        const displayDialog = ref(false); 
        const selectedAxis = reactive({
            x : {'name': '', optionDisabled: false} ,
            y : {'name': '', optionDisabled: false}
        })
        const selectedX: Ref<OptionType> = ref({'name': '', optionDisabled: false})
        const selectedY: Ref<OptionType> = ref({'name': '', optionDisabled: false})
        const data = toRefs(props).data
        const selectionLists: ComputedRef<AxisSelectionListInterface> = computed(() => {
            const dataFormat: OptionType[] = data.value.map((val:any) => ({name : val.name, optionDisabled: false}))
            return { 'x' : dataFormat, 'y' : copyArrayOfObjects(dataFormat) as OptionType[]}
        });
        //const testY = computed(() => {return copyArrayOfObjects(testX.value)})
        //const initialCopy = copyArrayOfObjects(testX.value) as OptionType[]

        //const testX = ref(initial)

        //const testY = ref(initialCopy)

        const axisSelection = (axis: AxisType) => {
            console.log("axisSelection")
            const axisToChange: AxisType = axis === "x" ? "y" : "x"
            selectionLists.value[axisToChange].forEach(option => {
                if (option.name === selectedAxis[axis].name) option.optionDisabled = true
                else option.optionDisabled = false 
            })    
        }

        const reinitAxisSelection = () => {
            selectedAxis.x = {'name': '', optionDisabled: false}
            selectedAxis.y = {'name': '', optionDisabled: false}
            selectionLists.value.x.forEach(option => option.optionDisabled = false)
            selectionLists.value.y.forEach(option => option.optionDisabled = false)
        }

        const closeDialog = () =>{
            displayDialog.value = false; 
            reinitAxisSelection();   
        }

        const newPlot = () => {
            console.log("newPlot")
            displayDialog.value = false; 
            emit("new-plot", selectedAxis.x.name, selectedAxis.y.name); 
        }

        return { displayDialog, selectedX, selectedY,  axisSelection, closeDialog, selectionLists, data, selectedAxis, newPlot }

    }

})

</script>

<style>

</style>