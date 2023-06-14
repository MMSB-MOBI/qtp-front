import * as d3 from "d3";
import { csvParse } from "d3";
import { ActiveCorners } from "./Axis";
import { trCoordinates } from './utils';

export type axType = 'bottom'| 'right';
export type axNum  = 1 | 2;
type axisType = "y" | "x1" | "x2"
type GSel =  d3.Selection<SVGGElement, unknown, null, undefined>;

export interface SlidersI {
    handlers: GSel[];
    ghosts: GSel[];
}

export class Sliders {
    svg: SVGSVGElement;
    specsBot: SlidersI = { handlers : [], ghosts : [] };
    specsRight: SlidersI = { handlers : [], ghosts : [] };
    currentAxType?: axType;
    currentAxNum?: axNum;
    //plotFrame: PlotFrame;
    bottomOffset: number;
    activeArea: ActiveCorners;  

    public get xLimits(): number[] {
        return this.specsBot.handlers.map((g)=> {
            const _ = g.attr('transform');
            ////console.log(`xAxis G ${_}`);
            const t = trCoordinates(g);
            return t[0];
        });
    }
    public get yLimits(): number[] {
        return this.specsRight.handlers.map((g)=>{
            const _ = g.attr('transform');
            ////console.log(`yAxis G ${_}`);            
            const t = trCoordinates(g);
            return t[1];
        });
    }
    constructor(svg: SVGSVGElement, activeCorners: ActiveCorners, bottomOffset=0){
        this.svg = svg;
        this.activeArea = activeCorners;
        this.bottomOffset = bottomOffset;
    }
    private slideFn?: (arg0: Sliders, arg1?: axType, arg2?: axNum) => void;
    private slideEndFn? : (arg0: Sliders) => void; 
    private drawHandler(axis: axType, count: axNum, threshold: number[]) {
        console.log("draw handler", axis)
        const size = 300;
       
        const h = Number.parseInt(d3.select(this.svg).style("height")),
              w = Number.parseInt(d3.select(this.svg).style("width"));
        
        const yPos = h - this.bottomOffset;
        let slCoor: number, slCoorLow: number|undefined;
        
        slCoor    = count == 2 ? threshold[1] : threshold[0]; 
        console.log("slCoor", slCoor)
        slCoorLow = count == 2 ? threshold[0] : undefined;    
        console.log("slCoorLow", slCoorLow)
        const frame = this.activeArea;
        //const sliders: SlidersI = { handlers : [], ghosts : [] };
        const sliders = axis == 'bottom' ? this.specsBot : this.specsRight;
        const generateHandlerG = (size: number, initCoor: number) => {
            const g = d3.select(this.svg).append('g').attr('class', 'symbol');
            const symbol = d3.symbol().type(d3.symbolTriangle).size(size);
            const handler = g.append('path')
            .attr('id', 'symbol')
            .attr('d', symbol)
            g.append('line')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)//-1 * xOffset)  // Bottom or right start point coor
            .attr('y2', (-1) * (frame.y2 - frame.y1) - this.bottomOffset )
            .attr("stroke", "gray")
            .attr('stroke-dasharray', "10,10")
            .attr('stroke-width', 2);
            g.attr('transform', axis == 'bottom'
                                ? `translate(${initCoor}, ${yPos})`
                                : `rotate(270, ${w},${initCoor}) translate(${w}, ${initCoor})`
                                );                    
            return g;
        }

        

        for (let i: axNum = 1 ; i <= count ; i++) {
            const gSlider = generateHandlerG(size, i == 1 ? slCoor : slCoorLow as number);
            gSlider.attr('class', 'handler')
                   .attr('fill', 'gray')
                   .attr('stroke-width', 1).attr("stroke", "gray")
            const gGhost = generateHandlerG(size, i == 1 ? slCoor : slCoorLow as number);
            gGhost.attr('class', 'handler-ghost')
                .attr('fill', 'gray')
                .attr('opacity', 0.2)
                .attr('visibility', 'hidden');
            const D = d3.drag()
                .on("start", (event, d) => {
                    //console.log(event);
                    gSlider.attr('stroke-width', 4).attr("stroke", "lime");
                    gGhost.attr('visibility', 'visible');
                    event.sourceEvent.stopPropagation();
                    this.currentAxNum = i;
                    this.currentAxType = axis;
                })
                .on("drag", (event, d: any) => {
                    let newCoor = 0;
                    if (i == 1) {                       
                        slCoor = axis == 'bottom' ? event.x : event.y;
                        if (count == 2)
                            slCoor = slCoor < (slCoorLow as number) 
                                            ? slCoorLow as number
                                            : slCoor;
                        newCoor = slCoor    
                    } else {
                        slCoorLow = axis == 'bottom' ? event.x : event.y;
                        slCoorLow = slCoorLow as number < slCoor 
                                    ? slCoorLow
                                    : slCoor;
                        newCoor = slCoorLow as number;
                    }
                    
                    if(axis == 'bottom') {
                        if(newCoor > frame.x2) 
                            newCoor = frame.x2;
                        else if(newCoor < frame.x1)
                            newCoor = frame.x1;
                    } else { 
                        //console.log(`Drag pourt ${newCoor} ${frame.y1} ${frame.y2}`);
                        if(newCoor > frame.y2) 
                            newCoor = frame.y2;
                        else if(newCoor < frame.y1)
                            newCoor = frame.y1;
                    }
                    gSlider.attr('transform', 
                                            axis == 'bottom' 
                                            ? `translate(${newCoor},${yPos})`
                                            : `rotate(270, ${w},${newCoor}) translate(${w},${newCoor})`
                                            );
                    if(this.slideFn)
                        this.slideFn(this, axis, i);

                })  
                .on("end", (event, d) => {
                    gSlider.attr('stroke-width', 1).attr("stroke", "gray");
                    gGhost.attr('visibility', 'hidden');
                    gGhost.attr('transform', gSlider.attr('transform'));
                    event.sourceEvent.stopPropagation();
                    this.currentAxNum = undefined;
                    this.currentAxType = undefined;
                    if(this.slideEndFn) this.slideEndFn(this)

                    
                    
                });// Could not fathom the proper types; 
                
            gSlider.call(D as any);
            gSlider.on('click', ()=> console.log("TOTOTO")); //  Cant stop that 
            /*
                    .on("click", (e, d) => {
                        console.log("S cliked??");
                        if (e.defaultPrevented) return; // dragged;
                        e.stopPropagation();
                    }); 
            */
            sliders.handlers.push(gSlider);
            sliders.ghosts.push(gGhost);
        }
        //console.dir(sliders);
        return sliders;
    }
    
    //https://observablehq.com/@d3/d3v6-migration-guide#event_drag
    draw(yThreshold : number, x1Threshold : number, x2Threshold: number){
        this.specsBot   = this.drawHandler("bottom", 2, [x1Threshold, x2Threshold]);
        this.specsRight = this.drawHandler("right", 1, [yThreshold]);
    }

    redrawSlider(axis: axisType, value:number){
        if(axis === "y") {
            this.reinitSpecsRight();
            this.specsRight = this.drawHandler('right', 1, [value])
            this.currentAxType = 'right'; 
        }

        if(axis === "x1"){
            const savex2 = this.xLimits[0]
            this.reinitSpecsBottom(); 
            this.specsBot = this.drawHandler('bottom', 2, [value, savex2])
            this.currentAxType = "bottom"; 
            this.currentAxNum = 2
        }

        if(axis === "x2"){
            const savex1 = this.xLimits[1]
            this.reinitSpecsBottom(); 
            this.specsBot = this.drawHandler('bottom', 2, [savex1, value])
            this.currentAxType = "bottom"; 
            this.currentAxNum = 1
        }
    }

    reinitSpecsRight(){
        this.specsRight.handlers.forEach(handler => handler.remove())
        this.specsRight = { handlers : [], ghosts : [] };
    }

    reinitSpecsBottom(){
        console.log(this.specsBot.handlers)
        this.specsBot.handlers.forEach(handler => handler.remove())
        this.specsBot = { handlers : [], ghosts : [] };
        console.log(this.specsBot.handlers)
    }

    public onSlide(callback: (arg0: Sliders, arg1?: axType, arg2?: axNum) => void){
       this.slideFn = callback;
    }

    public onSlideEnd(callback:() => void){
        this.slideEndFn = callback
    }


        
}
