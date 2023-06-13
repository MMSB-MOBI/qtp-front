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
                <!-- <div class="flex gap-1">
                    <InputNumber style="width: 5rem" v-model="pvalue" :minFractionDigits="2" :min="0" :max="1" :step="0.05" showButtons buttonLayout="vertical"/> 
                    <Button label="Go" @click="clickPvalue" />
                    <InputNumber style="width: 5rem" v-model="pvalue" :minFractionDigits="2" :min="0" :max="1" :step="0.05" showButtons buttonLayout="vertical"/> 
                    <Button label="Go" @click="clickPvalue" />
                    <InputNumber style="width: 5rem" v-model="pvalue" :minFractionDigits="2" :min="0" :max="1" :step="0.05" showButtons buttonLayout="vertical"/> 
                    <Button label="Go" @click="clickPvalue" />
                </div> -->

                 


                    <!-- <InputNumber v-model="ratio1" :minFractionDigits="2" showButtons :min="0" :max="1" :step="0.05"/> <Button label="Go" @click="clickPvalue" />
                    <InputNumber v-model="ratio2" :minFractionDigits="2" showButtons :min="0" :max="1" :step="0.05"/> <Button label="Go" @click="clickPvalue" /> -->

                <div class="flex w-full gap-3 p-3" v-if="volcanoDrawed">
                    <div class="bg-pannelSelection border border-black w-1/6"/>
                    <div class="flex-grow w-5/6">
                        <span> Selected area </span>
                    </div>
                </div>

                <div class="threshold_container">
                        <span>p-Value threshold :</span>
                        <div class="flex gap-1" style="height: 2rem">
                            <InputNumber v-model="pvalue" :minFractionDigits="2" :min="0" :max="1" :step="0.05" showButtons/> <Button label="Apply " @click="clickPvalue"/>
                        </div>
                        
                </div>

                <div class="flex gap-2">
                   
                    <div class="threshold_container">
                        <span> Abundance ratio lower threshold: </span>
                        <div class="flex gap-1" style="height: 2rem">
                            <InputNumber v-model="ratio_lower" :minFractionDigits="2" showButtons :max="ratio_higher"/> <Button label="Apply " @click="clickLowerRatio"/>
                        </div>
                    </div>
                     <div class="threshold_container">
                        <span> Abundance ratio higher threshold: </span>
                        <div class="flex gap-1" style="height: 2rem">
                            <InputNumber v-model="ratio_higher" :minFractionDigits="2" showButtons :min="ratio_lower"/> <Button label="Apply " @click="clickHigherRatio"/>
                        </div>
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
                            :taxid="proteome.name"
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
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'

const UniprotDatabase = logDB(); 

export default defineComponent({
    components : { Error, ProteinsList, GoList, Loader, PathwayStats, Button, InputNumber, InputText }, 

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
        const sliders : Ref<Sliders|null> = ref(null)
        const axis : Ref<Axis|null> = ref(null)
        const layer: Ref<ActiveLayers|null> = ref(null)
        const volcanoDrawed = ref(false); 
        const filteredByPannelPoints: Ref<Points[]> = ref([])
        const goSelected : Ref<GOObject[]> = ref([])
        const goLoaded = ref(false); 
        const store = useStore();

        const pvalue = ref(0.05); 
        const ratio_lower = ref(-1)
        const ratio_higher = ref(1)

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
            console.log("draw plot", transformy.value)
            layer.value = new ActiveLayers(svgRoot.value as SVGSVGElement);
            axis.value = new Axis(svgRoot.value as SVGSVGElement,
                                  props.height, props.width,
                                  transformy.value != "none" ? transformy.value : undefined );
            
         
            axis.value.draw(allPoints.value, data.xLabel, data.yLabel);
            
            layer.value.activeArea = axis.value.getActiveCorners();
            volcano.value = new VolcanoPlot(svgRoot.value as SVGSVGElement,
                                  axis.value.xScale,
                                  axis.value.yScale,
                                  axis.value.frame,
                                  axis.value.gX,
                                  axis.value.gY);  

            volcano.value.draw(allPoints.value);

            const yPvalueThres = transformy.value === '-log10' ? -Math.log10(0.05) : transformy.value === 'log10' ? Math.log10(0.05) : 0.05

            sliders.value = new Sliders(svgRoot.value as SVGSVGElement, 
                                         axis.value.getActiveCorners(), 
                                         axis.value.marginBot.marginOuter);  

            sliders.value.draw(axis.value.yScale(yPvalueThres), axis.value.xScale(-1), axis.value.xScale(1)); 
            sliders.value.onSlide(() => {
                layer.value!.resize(sliders.value!)
            });

            selectAllPannels(sliders.value, layer.value, axis.value.xScale, axis.value.yScale);

            volcanoDrawed.value = true

            emit('volcano-drawed')


            layer.value.onSelectedLayerClick((x,y) => {
                console.log("click rect")
                const unselectCoords = layer.value!.getClickRectCoords(sliders.value!, x,y); 
                const predicate = filterPredicateLayerCoords(unselectCoords, axis.value!.xScale, axis.value!.yScale);
                removeFilterPoints(predicate)
            })

            axis.value.onActiveBackgroundClick( (x, y)=> {
                console.log("click background")
                const selectCoords = layer.value!.toggle(sliders.value!, x, y);
                const predicate = filterPredicateLayerCoords(selectCoords, axis.value!.xScale, axis.value!.yScale)
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

        const clickPvalue = () => {
            const pvalue_transform = transformy.value === '-log10' ? -Math.log10(pvalue.value) : transformy.value === 'log10' ? Math.log10(pvalue.value) : pvalue.value
            console.log("xlimits", sliders.value!.xLimits)
            console.log("ylimits", sliders.value!.yLimits)
            sliders.value!.redrawSlider('y', axis.value!.yScale(pvalue_transform))
            console.log("xlimits after", sliders.value!.xLimits)
            console.log("ylimits after", sliders.value!.yLimits)
            layer.value!.resize(sliders.value!)
        }

        const clickLowerRatio = () => {
            sliders.value!.redrawSlider('x1', axis.value!.xScale(ratio_lower.value))
            layer.value!.resize(sliders.value!)
        }

        const clickHigherRatio = () => {
            sliders.value!.redrawSlider('x2', axis.value!.xScale(ratio_higher.value))
            layer.value!.resize(sliders.value!)
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

        return { error, svgRoot, volcanoDrawed, transformy, filteredByPannelPoints, goSelected, goLoaded, statsComputed, goDisabled, goPartWidth, disableGO, allPoints, withAnnotationPoints, triggerStatsRefresh, data, highlightFromProt, highlightFromGo, proteome, pvalue, clickPvalue, ratio_lower, ratio_higher, clickLowerRatio, clickHigherRatio }
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

.threshold_container {
    display: flex;
    flex-direction: column; 
}

</style>