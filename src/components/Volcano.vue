<template>
<div>
    <!-- <button @click="test()" class="p-1 border rounded shadow w-15 h-10">TEST</button> -->

<div v-if="!error" class="bg-gray-100">
    <svg ref="svgRoot">
    </svg>
    <div v-if="drawed" class="flex w-full gap-3 p-3">
        <div class="bg-pannelSelection border border-black w-1/6">

        </div>
        <div class="flex-grow w-5/6">
            <span> Selected area </span>
        </div>

    </div>
</div>
<Error v-if="error" message="error with volcano plot"/>
</div>

</template>

<script lang="ts">
/*
class VolcanoData {
    x: number[];
    y: number[];
    xLabel:string;

    constructor(x: number[], xLabel:string, )
} 
*/

import { defineComponent, PropType, ref, onMounted, computed, Ref, watch, toRefs, onUnmounted, onUpdated } from 'vue';
    
import * as d3 from "d3";

import { Axis } from '../utilities/d3/Axis';
import VolcanoPlot from '../utilities/d3/VolcanoPlot';
import { Sliders } from '../utilities/d3/Sliders';
import ActiveLayers from '../utilities/d3/ActiveLayers';
import * as t from '../utilities/models/volcano';
import { useStore } from 'vuex';
import { UniprotDatabase } from '../utilities/uniprot-database';
import Error from '@/components/global/Error.vue'; 
/*
This will have to be made reactive in parent .vue
*/

export default defineComponent({

   components: { Error },

   props: {
        data: {
            type: Object as PropType<t.plotData>,
            default : {
                x:[],
                y:[],
                d:[],
                xLabel:'',
                yLabel:''
            }
        
        },
        transformy : {
            type: String as PropType<t.transform>,
            default: "none" as t.transform
        },
        height: {
            type: Number as PropType<number>,
            default:500
        },
        width: {
            type: Number as PropType<number>,
            default:500
        },
    },
    setup(props, { emit }){
        const store = useStore(); 
        const error = ref(false); 
        const drawed = ref(false); 

        //const allPoints: Ref<t.Points[]> = ref([]); 
        //const filteredPoints: Ref<t.Points[]> = ref([]); 
        const uniprotID = store.getters.getColDataByName("Accession", "string");

        const svgRoot: Ref<SVGSVGElement|null> = ref(null);

        const volcano: Ref<VolcanoPlot|null> = ref(null); 
        // Getting props (reactive) references
        const { data, transformy } = toRefs(props)

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

        const erase = () => {
            emit('volcano-empty-draw')
            d3.select(svgRoot.value).selectAll('*').remove();
        }
        /*
        const filterPoints = (coords: t.Selection, xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>) => {
            console.log("filterPoints"); 
            filteredPoints.value = allPoints.value.filter(point => xScale(point.x) > coords.x1 && xScale(point.x) <= coords.x2 && yScale(point.y) > coords.y1 && yScale(point.y) <= coords.y2)
            console.log(filteredPoints.value); 

        }*/

        //const triggerLoadedEvent = () => {//console.log("triggerLoadedEvent"); emit('volcano-loaded-draw')}; 
        const defaultSelectionArea = (sliderUI: Sliders, layerUI : ActiveLayers, xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>) => {
            const x_lims = sliderUI.xLimits.sort((a: number, b: number) => a - b)
            const y_lims = sliderUI.yLimits.sort((a: number, b: number) => a - b)
            x_lims.push(x_lims[0] - 1)
            y_lims.push(y_lims[0] - 1)

            x_lims.forEach(x => {
               y_lims.forEach(y => {
                    const layer_coords = layerUI.toggle(sliderUI, x, y)
                    const predicate = filterPoints(layer_coords, xScale, yScale)
                    store.commit("proteinSelection/addToFilterPannel", predicate)
                })
            })
        }

        const filterPoints = (layer_coords: {x1:number, x2:number, y1:number, y2:number}, xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>) => {
            
            const filterPointsPredicate = (point: t.Points): boolean => {
                return xScale(point.x) > layer_coords.x1 && xScale(point.x) <= layer_coords.x2 && yScale(point.y) > layer_coords.y1 && yScale(point.y) <= layer_coords.y2
                
            }
            return filterPointsPredicate

        }

        const draw = async (data: t.plotData, yTransform: t.transform=transformy.value) => {
            console.log("Drawing&Erasing");
            erase();


            //TO DO : don't do UniprotDatabase.get here because it's already done on parent component DataExplore
            
            const pointList = await Promise.all( data.x.map(async (e, i) => ({
                x:e, 
                y: yTransform == '-log10' ? (-1)*Math.log10(data.y[i])
                                          : yTransform == 'log10'  ? Math.log10(data.y[i])
                                          : data.y[i], // aka 'none'
                d: data.d[i]
                }) ));

            const layerUI = new ActiveLayers(svgRoot.value as SVGSVGElement);

            //console.log(`Creating Axis for ${yTransform}`);     
                  
            const axis = new Axis(svgRoot.value as SVGSVGElement,
                                  props.height, props.width,
                                  yTransform != "none" ? yTransform : undefined );
            //console.log("Drawing Axis");     
                  
            const p: t.Points[] = axis.draw(pointList, 
                                            props.data.xLabel, props.data.yLabel
                                        );

            layerUI.activeArea = axis.getActiveCorners();
            
            //console.log("Creating Plot");            
            volcano.value = new VolcanoPlot(svgRoot.value as SVGSVGElement,
                                  axis.xScale,
                                  axis.yScale,
                                  axis.frame,
                                  axis.gX,
                                  axis.gY);            
            //console.log("Drawing Plot");   

            volcano.value.draw(p);
            
            //console.log("Creating Sliders");                        
            const sliderUI = new Sliders(svgRoot.value as SVGSVGElement, 
                                         axis.getActiveCorners(), 
                                         axis.marginBot.marginOuter);           
            //console.log("Drawing Sliders");                        
            sliderUI.draw();

            store.commit('proteinSelection/initAllPoints', pointList);

            defaultSelectionArea(sliderUI, layerUI, axis.xScale, axis.yScale); 
   
            // Adding/Resizing Layers Logic
            axis.onActiveBackgroundClick( (x, y)=> {
                const selectCoords = layerUI.toggle(sliderUI, x, y);
                const predicate = filterPoints(selectCoords, axis.xScale, axis.yScale)
                store.commit("proteinSelection/addToFilterPannel", predicate)
            
            } );

            layerUI.onSelectedLayerClick((x,y) => {
                const unselectCoords = layerUI.getClickRectCoords(sliderUI, x,y); 
                const predicate = filterPoints(unselectCoords, axis.xScale, axis.yScale);
                store.commit("proteinSelection/removeFromFilterPannel", predicate); 
            })

            sliderUI.onSlide(() => layerUI.resize(sliderUI) );
            drawed.value = true; 
            emit('volcano-loaded-draw'); 

        /* Trying zooming stuff  TO BE CONTINUED 
            https://observablehq.com/@d3/zoomable-scatterplot
            http://bl.ocks.org/stepheneb/1182434
        */

        /*
            const k = Number.parseInt(d3.select(svgRoot.value).attr('height')) / Number.parseInt(d3.select(svgRoot.value).attr('width'));
            const xAxis = (g: any, x: any) =>  {
                if (svgRoot.value) 
                    g.attr("transform", `translate(0,${d3.select(svgRoot.value).attr('height')})`)
                .call(d3.axisTop(x).ticks(12))
            };
            const yAxis = (g: any, y: any) => g.call(d3.axisRight(y).ticks(12 * k))
            .call((g: any) => g.select(".domain").attr("display", "none"));

            function zoomed(e: any) {
                const zx = e.transform.rescaleX(axis.xScale).interpolate(d3.interpolateRound);
                const zy = e.transform.rescaleY(axis.yScale).interpolate(d3.interpolateRound);
                d3.select(svgRoot.value).selectAll('circle')
                    .attr("transform", e.transform).attr("stroke-width", 5 / e.transform.k);
                axis.gX?.call(xAxis, zx);
                axis.gY?.call(yAxis, zy);
               // gGrid.call(grid, zx, zy);
            }
             const zoom = d3.zoom()
                .scaleExtent([1, 32])
                .on("zoom", zoomed);
             d3.select(svgRoot.value).call(zoom as any).call(zoom.transform as any, d3.zoomIdentity);
        */
        /* ---------------- */
        };

        watch( (props.data), async (newData, oldData) =>{
            
            console.log("PLOT DATA CHANGES")
            //GO SEARCH IN WORKER AND STORE IT INTO STORE
            await draw(newData, transformy.value);
            
        });
        watch( (transformy), (newTransform, oldTransform) =>{
            //console.log("transform changed from");
            //console.dir(newTransform);
            //console.log("to");
            //console.dir(oldTransform);
            store.commit("proteinSelection/clearFilterPoints")
            draw(data.value, newTransform);
        });
        onMounted(() => {
            //console.log("onMounted")
        // the DOM element will be assigned to the ref after initial render
        ////console.log(svgRoot.value) // <div>This is a root element</div>
            d3.select(svgRoot.value)
            .attr("height", props.height)
            .attr("width", props.width)
            .attr("class", "volcano-svg-component");
        });
        onUnmounted(() => {
            store.commit('proteinSelection/clearFilterPoints')
            unsubscribe(); 
        }), 

        onUpdated(() => {
            console.log("UPDATE VOLCANO")
        })

      return {
        svgRoot, error, drawed
      }
    }
});
</script>

<style scoped>
.volcano-svg-component{
    background-color: AliceBlue;
}
.axis path,
.tick line,
.tick text {
    stroke: #666;
    stroke-width: 0.5px;
    stroke-opacity: 0.5;
}
.label {
    fill: #666;
    font-weight: 700;
    font-size: 12px;
}
</style>