import { ActionContext } from 'vuex';
import * as XLSX from 'xlsx';
import * as t from '../../utilities/models/volcano';


interface ProteinSelection{
  allPoints: t.Points[]; //all proteins points
  filterPannelPoints: t.Points[]; //proteins that are selected under yellow panel
  coloredSvg: any[]; //proteins points that are colored in red
  pannelGO : t.GOIndexed;

}

interface FilterOptions{
  coords: t.Selection; 
  xScale: d3.ScaleLinear<number, number>;
  yScale: d3.ScaleLinear<number, number>;
}

export const proteinSelection = {
  namespaced: true, 
  state: {
    allPoints: [],
    filterPannelPoints : [],
    coloredSvg : [],
    pannelGO : {}
  } as ProteinSelection,

  mutations: {
    initAllPoints(state: ProteinSelection, pointList: t.Points[]){
      state.allPoints = pointList; 
    }, 

    addFilterPoints(state: ProteinSelection, opts: FilterOptions){ 
      state.filterPannelPoints = state.filterPannelPoints.concat(state.allPoints.filter(point => opts.xScale(point.x) > opts.coords.x1 && opts.xScale(point.x) <= opts.coords.x2 && opts.yScale(point.y) > opts.coords.y1 && opts.yScale(point.y) <= opts.coords.y2));
    },

    removeFilterPoints(state: ProteinSelection, opts: FilterOptions){
      const toDelId: t.Points[] = state.allPoints.filter(point => opts.xScale(point.x) > opts.coords.x1 && opts.xScale(point.x) <= opts.coords.x2 && opts.yScale(point.y) > opts.coords.y1 && opts.yScale(point.y) <= opts.coords.y2)
      state.filterPannelPoints = state.filterPannelPoints.filter(point => !toDelId.includes(point))
    },

    clearFilterPoints(state: ProteinSelection){
      state.filterPannelPoints = []; 
    },

    filterHighlight(state: ProteinSelection, predicate_fn: (point:t.Points ) => boolean){
      const filter_svg = state.allPoints.filter(point => predicate_fn(point)).map(p => p.svg)
      state.coloredSvg = filter_svg
    },

    addToFilterPannel(state: ProteinSelection, predicate_fn: (point:t.Points ) => boolean){
      state.filterPannelPoints = state.filterPannelPoints.concat(state.allPoints.filter(point => predicate_fn(point)))
    },

    removeFromFilterPannel(state: ProteinSelection, predicate_fn: (point:t.Points ) => boolean){
      state.filterPannelPoints = state.filterPannelPoints.filter(point => !predicate_fn(point))
    }, 

    mutatePannelGO(state:ProteinSelection, go_data: t.GOIndexed) {
      state.pannelGO = go_data; 
    }
  }
}