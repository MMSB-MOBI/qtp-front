<template>
<div>
    X {{message}}
</div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs} from 'vue'; 

export default defineComponent({

    props: {
        message:{
            type: String as PropType<string>,
            default: ''
        }
    }

})
</script>

<style scoped>
div{
    color:red; 
}
</style>