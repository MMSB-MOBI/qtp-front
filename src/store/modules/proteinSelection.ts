import { ActionContext } from 'vuex';
import * as XLSX from 'xlsx';
import * as t from '../../utilities/models/volcano';


interface ProteinSelection{
  allPoints: t.Points[]; 
  filterPoints: t.Points[]; 
  coloredSvg: any[];

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
    filterPoints : [],
    coloredSvg : []
  } as ProteinSelection,

  mutations: {
    initAllPoints(state: ProteinSelection, pointList: t.Points[]){
      state.allPoints = pointList; 
    }, 

    addFilterPoints(state: ProteinSelection, opts: FilterOptions){ 
      state.filterPoints = state.filterPoints.concat(state.allPoints.filter(point => opts.xScale(point.x) > opts.coords.x1 && opts.xScale(point.x) <= opts.coords.x2 && opts.yScale(point.y) > opts.coords.y1 && opts.yScale(point.y) <= opts.coords.y2));
    },
    removeFilterPoints(state: ProteinSelection, opts: FilterOptions){
      const toDelId: t.Points[] = state.allPoints.filter(point => opts.xScale(point.x) > opts.coords.x1 && opts.xScale(point.x) <= opts.coords.x2 && opts.yScale(point.y) > opts.coords.y1 && opts.yScale(point.y) <= opts.coords.y2)
      state.filterPoints = state.filterPoints.filter(point => !toDelId.includes(point))
    },
    clearFilterPoints(state: ProteinSelection){
      state.filterPoints = []; 
    },

    filterHighlight(state: ProteinSelection, predicate_fn: (point:t.Points ) => boolean){
      const filter_svg = state.allPoints.filter(point => predicate_fn(point)).map(p => p.svg)
      state.coloredSvg = filter_svg
    }
  }
}