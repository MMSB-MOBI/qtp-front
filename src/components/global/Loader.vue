<template>
<div>
    {{message}}
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
</style>