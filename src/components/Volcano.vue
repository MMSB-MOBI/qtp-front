<template>
    <div class="root">
        <div v-if="!error" class="flex gap-10">
            <!-- plot part -->
            <div>
                <div>
                    <b>{{ allPoints.length }} proteins </b> have been found with annotation in local database.
                </div>
                <!-- transformy buttons -->
                <div class="tab mt-2" v-if="volcanoDrawed">
                    <button class="tablinks" :class="{ active: transformy === 'none' }" @click="transformy = 'none'"> Raw </button>
                    <button class="tablinks" :class="{ active: transformy === '-log10' }" @click="transformy = '-log10'"> - Log10 transformation </button>
                    <button class="tablinks" :class="{ active: transformy === 'log10' }" @click="transformy = 'log10'"> Log10 transformation </button>
                </div>
                
                <!-- d3 volcano -->
                <div>
                    <svg ref="svgRoot"/>
                </div>

                <!-- legend -->
                <div class="flex w-full gap-3 p-3" v-if="volcanoDrawed">
                    <div class="bg-pannelSelection border border-black w-1/6"/>
                    <div class="flex-grow w-5/6">
                        <span> Selected area </span>
                    </div>
                </div>
            </div>

            <!--filtered prot and go part -->
            <div v-if="volcanoDrawed" class="flex w-full mt-2 flex-col">
                <div class="flex gap-4">
                <!-- prot list -->
                    <ProteinsList :points="filteredByPannelPoints" class="w-1/3" @click-on-prot="highlightFromProt"/>
                    <!-- go list -->
                    <div class="flex w-2/3 gap-2">
                        <div :class="goPartWidth.list">
                            <Loader v-if="!goLoaded" :class="goPartWidth.list" message="GO terms are loading..."/>
                            <GoList v-else :go="goSelected" :disabled="goDisabled" @click-on-go="highlightFromGo"/>
                        </div>
                        <PathwayStats 
                            :class="goPartWidth.stats"
                            :selectedProts="filteredByPannelPoints.map(point => point.d.id)"
                            :allProts="withAnnotationPoints.map(point => point.d.id)"
                            :taxid="proteome"
                            @disable-go="disableGO"
                            :refresh="triggerStatsRefresh"
                            @click-on-go="highlightFromProt"/>
                    </div>


                </div>                
            </div>

            

        </div>
        <Error v-if="error" message="Error with volcano plot>"/>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, toRefs, Ref, watch, onMounted, computed, onUnmounted, reactive, ComputedRef } from 'vue'; 

import * as d3 from "d3";

import { PlotData, Points, transform, GOObject } from '../types/volcano';

import {useStore} from 'vuex'

import ActiveLayers from '../utilities/d3/ActiveLayers';
import { Axis } from '../utilities/d3/Axis';
import VolcanoPlot from '../utilities/d3/VolcanoPlot';
import { Sliders } from '../utilities/d3/Sliders';

import Error from '@/components/global/Error.vue'; 
import Loader from '@/components/global/Loader.vue'; 
import ProteinsList from '@/components/ProteinsList.vue'
import GoList from '@/components/GoList.vue'
import PathwayStats from '@/components/PathwayStats.vue'
import Button from 'primevue/button'
import { logDB } from '@/utilities/uniprot-storage';

const UniprotDatabase = logDB(); 

export default defineComponent({
    components : { Error, ProteinsList, GoList, Loader, PathwayStats, Button }, 

    props: {
        data: {
            type: Object as PropType<PlotData>,
            default : {
                x:[],
                y:[],
                d:[],
                xLabel:'',
                yLabel:''
            }
        
        },
        height: {
            type: Number as PropType<number>,
            default:500
        },
        width: {
            type: Number as PropType<number>,
            default:500
        },
        disabled: {
            type: Boolean as PropType<boolean>,
            default: false
        },
        plotNumber : {
            type : Number as PropType<number>, 
            default : 0
        }
    },

    setup(props, {emit}){
        
        const data = toRefs(props).data 
        const protToGoWorker = new Worker('@/workers/protToGoWorker.ts', {type: 'module'})
        //ATTRIBUTES
        const error = ref(false); 
        const svgRoot: Ref<SVGSVGElement|null> = ref(null)
        const transformy: Ref<transform> = ref("none"); 
        const volcano: Ref<VolcanoPlot|null> = ref(null); //Save the volcano object
        const volcanoDrawed = ref(false); 
        const filteredByPannelPoints: Ref<Points[]> = ref([])
        const goSelected : Ref<GOObject[]> = ref([])
        const goLoaded = ref(false); 
        const store = useStore();

        const proteome = computed(() => {
            console.log("proteome get in volcano", UniprotDatabase.proteome)
            return UniprotDatabase.proteome
        })

        const allPoints: ComputedRef<Points[]> = computed(() => {
            const points = props.data.points.map(point => ({
                x: point.x, 
                y: transformy.value == '-log10' ? (-1)*Math.log10(point.y)
                                          : transformy.value == 'log10'  ? Math.log10(point.y)
                                          : point.y, // aka 'none'
                d : point.d
            }))
            //store.commit("proteinSelection/initAllPoints", points)

            return points.filter(point => point.d !== undefined)
        });

        const withAnnotationPoints: ComputedRef<Points[]> = computed(() => {
            return allPoints.value.filter(point => point.d !== undefined)
        })

        const statsComputed: Ref<boolean> = ref(false); 
        const goDisabled: Ref<boolean> = ref(false); 

        const goPartWidth = reactive({'list' : 'w-3/4', 'stats': 'w-1/4'})
        const triggerStatsRefresh = ref(false); 

        //METHODS

        const draw = async(data : PlotData) => {
            erase(); 
            //console.log("draw plot")
            const layerUI = new ActiveLayers(svgRoot.value as SVGSVGElement);
            const axis = new Axis(svgRoot.value as SVGSVGElement,
                                  props.height, props.width,
                                  transformy.value != "none" ? transformy.value : undefined );
            //console.log(data.xLabel, data.yLabel); 
            axis.draw(allPoints.value, data.xLabel, data.yLabel);
            layerUI.activeArea = axis.getActiveCorners();
            volcano.value = new VolcanoPlot(svgRoot.value as SVGSVGElement,
                                  axis.xScale,
                                  axis.yScale,
                                  axis.frame,
                                  axis.gX,
                                  axis.gY);  

            volcano.value.draw(allPoints.value);

            const sliderUI = new Sliders(svgRoot.value as SVGSVGElement, 
                                         axis.getActiveCorners(), 
                                         axis.marginBot.marginOuter);  

            sliderUI.draw();
            sliderUI.onSlide(() => layerUI.resize(sliderUI));

            selectAllPannels(sliderUI, layerUI, axis.xScale, axis.yScale);

            volcanoDrawed.value = true
            emit('volcano-drawed')

            layerUI.onSelectedLayerClick((x,y) => {
                console.log("click")
                const unselectCoords = layerUI.getClickRectCoords(sliderUI, x,y); 
                const predicate = filterPredicateLayerCoords(unselectCoords, axis.xScale, axis.yScale);
                removeFilterPoints(predicate)
            })

            axis.onActiveBackgroundClick( (x, y)=> {
                const selectCoords = layerUI.toggle(sliderUI, x, y);
                const predicate = filterPredicateLayerCoords(selectCoords, axis.xScale, axis.yScale)
                addFilterPoints(predicate); 
            
            } );

        }

        const erase = () => {
            if(svgRoot.value) d3.select(svgRoot.value).selectAll('*').remove();
        }
        
        /*Allow the selection of all pannels*/
        const selectAllPannels = (sliderUI: Sliders, layerUI : ActiveLayers, xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>) => {
            const x_lims = sliderUI.xLimits.sort((a: number, b: number) => a - b)
            const y_lims = sliderUI.yLimits.sort((a: number, b: number) => a - b)
            x_lims.push(x_lims[0] - 1)
            y_lims.push(y_lims[0] - 1)

            x_lims.forEach(x => {
               y_lims.forEach(y => {
                    const layerCoords = layerUI.toggle(sliderUI, x, y)
                })
            })
            filteredByPannelPoints.value = withAnnotationPoints.value
            emit("prot-selection-change", filteredByPannelPoints.value)

            //console.log(allPoints.value)
            //console.log(JSON.parse(JSON.stringify(allPoints.value)))
            
        }

        const removeFilterPoints = (predicateFn: (point: Points) => boolean) => {
            const newPoints = filteredByPannelPoints.value.filter(point => !predicateFn(point))
            filterPointsAction(newPoints); 
            
        }


        const addFilterPoints = (predicateFn: (point:Points) => boolean) => {
            const newPoints = filteredByPannelPoints.value.concat(withAnnotationPoints.value.filter(point => predicateFn(point)))
            filterPointsAction(newPoints); 
        }

        const filterPointsAction = (newPoints : Points[]) => {
            if((newPoints.length !== filteredByPannelPoints.value.length) && goDisabled.value){
                triggerStatsRefresh.value = true; 
                enableGO(); 
            }
            filteredByPannelPoints.value = newPoints
            emit("prot-selection-change", filteredByPannelPoints.value)
        }
    

        const filterPredicateLayerCoords = (layer_coords: {x1:number, x2:number, y1:number, y2:number}, xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>)  => {
             const predicate = (point: Points): boolean => {
                return xScale(point.x) > layer_coords.x1 && xScale(point.x) <= layer_coords.x2 && yScale(point.y) > layer_coords.y1 && yScale(point.y) <= layer_coords.y2   
            }
            return predicate
        }

        const unsubscribe = store.subscribe((mutation, state) => {
            if (mutation.type === "proteinSelection/filterHighlight"){
                if(!volcano) {
                    console.error("volcano error")
                    error.value = true; 
                }
                const volcano_plot = volcano.value as VolcanoPlot
                volcano_plot.redrawCircle(state.proteinSelection.coloredSvg)
            }
        })

        const disableGO = () => {
            goDisabled.value = true; 
            goPartWidth.list = 'w-1/5'
            goPartWidth.stats = 'w-4/5'
            triggerStatsRefresh.value = false; 
        }

        const enableGO = () => {
            goDisabled.value = false; 
            goPartWidth.list = 'w-3/4'
            goPartWidth.stats = 'w-1/4'
        }

        const filterPoints = (predicate:(point:Points)=>boolean) => {
            return withAnnotationPoints.value.filter(point => predicate(point))
        }

        const highlightPoints = (svgPoints:any[]) => { //TO DO : type svg ? 
            //Get svg points from prot ids
            const volcano_plot = volcano.value as VolcanoPlot
            volcano_plot.redrawCircle(svgPoints); 
        } 

        const highlightFromProt = (selectedProteins: string[]) => {
            const predicateFn = (point:Points) => {
                if (selectedProteins.includes(point.d.id)) return true
                else return false
            }
            const filteredPoints = filterPoints(predicateFn)
            highlightPoints(filteredPoints.map(p => p.svg))
        }

        const highlightFromGo = (selectedGO : string[]) => {
            console.log("highlightFromGo", selectedGO); 
            const predicateFn = (point: Points) => {
                const pointGO = point.d.unigoGO.map(go => go.go)
                const intersect = selectedGO.filter(go_id => pointGO.includes(go_id))
                if (intersect.length === 0) return false
                else return true
            }

            const filteredPoints = filterPoints(predicateFn)
            console.log("filter", filteredPoints);
            highlightPoints(filteredPoints.map(p => p.svg))
        }


        //WATCHERS 
        watch( (props.data), async (newData) =>{
            console.log("data change"); 
            await draw(newData);          
        });

        watch( (transformy), async () =>{
            await draw(props.data);
        });

        watch ( (filteredByPannelPoints), () => {
            goLoaded.value = false; 
            const serializedData = JSON.parse(JSON.stringify(filteredByPannelPoints.value.map(p => p.d)))
            protToGoWorker.postMessage(serializedData);
        })

        onMounted( () => {
            console.log("Volcano mounted")
            //console.log(svgRoot.value)
            console.log(data.value.xLabel)
            d3.select(svgRoot.value)
            .attr("height", props.height)
            .attr("width", props.width)
            .attr("class", `volcano-svg-component-${props.plotNumber}`);

            draw(data.value); 

            protToGoWorker.onmessage = event => {
                const data = event.data as GOObject[]; 
                goSelected.value = data
                goLoaded.value = true; 
            }
        });

        onUnmounted( () => {
            unsubscribe();
            protToGoWorker.terminate(); 
        })

        return { error, svgRoot, volcanoDrawed, transformy, filteredByPannelPoints, goSelected, goLoaded, statsComputed, goDisabled, goPartWidth, disableGO, allPoints, withAnnotationPoints, triggerStatsRefresh, data, highlightFromProt, highlightFromGo, proteome }
    }

})

</script>

<style scoped>
.tab {
  overflow: hidden;
  border: 1px solid #ccc;
  background-color: #f1f1f1;
}

.tab button {
  background-color: inherit;
  float: left;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 14px 16px;
  transition: 0.3s;
}

.tab button:hover {
  background-color: #ddd;
}

.tab button.active {
  background-color: #ccc;
}

.root{
    position:relative; 
}

.disabled{
    position:absolute; 
    width:100%;
    height:100%;
    background-color:black;
    opacity:0.7;  
}



</style>