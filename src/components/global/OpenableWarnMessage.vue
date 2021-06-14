<template>
    <div>
        <div class="header" @click="openMessage" :class="{ 'open': opened }">
            <div class="header-text">
                <i class="pi pi-exclamation-triangle"></i>
                <span> {{ header }} </span>
            </div>
            <i class="right-icon pi" :class="openIcon"> </i>
        </div>
        <div v-if="opened" class="content">
            <p v-if="content" class="content-text text-sm"> {{ content }}</p>
            <div v-if="contentTab" class="content-tab text-sm">
                <ul v-for="item of contentTab" :key="item">
                    <li> {{ item }} </li>
                </ul>
            </div>
        </div>
    </div>
  
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed } from "vue"
import Message from 'primevue/message'


export default defineComponent({
    components : {Message}, 
    props : {
        header: {
            type: String as PropType<string>,
            default: ""
        }, 
        content: {
            type: String as PropType<string>, 
            default: ""
        },
        contentTab: {
            type: Array as PropType<string[]>,
            default: []
        }
    },

    setup(){
        const opened = ref(false); 

        const openIcon = ref('pi-chevron-down')

        const openMessage = () => {
            opened.value = !opened.value; 
            openIcon.value = opened.value ? 'pi-chevron-up' : 'pi-chevron-down'; 
        }

        return {opened, openMessage, openIcon}
    }

})
</script>

<style scoped>
.header{
    display:flex; 
    align-items: center;
    justify-content: space-between;
    padding:0.5rem;
    background: #FFECB3;
    color: #7f6003;
    font-weight: 500;
}

.header:hover{
    background: #ffdf80; 
    cursor:pointer; 
    color:#4b3802; 
}

.header.open{
    background: #ffdf80;
    color:#4b3802; 
}

.header-text {
    display:flex;
    align-items: center;
    width:auto; 
    column-gap:1rem; 
    margin-left:0.5rem;
}

.right-icon{
    width:min-content; 
    margin-right:0.5rem; 
}

.content{
    background: #FFECB3;
    border: #ffdf80 solid; 
    border-width:2px; 
}

.content-text{
    padding:0.5rem; 

}

.content-tab{
    max-height:10rem; 
    overflow:scroll; 
    padding:0rem 0.5rem 0.5rem 0.5rem; 
}

</style>