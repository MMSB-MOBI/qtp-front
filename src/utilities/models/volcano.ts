interface PlotData {
    xLabel: string;
    yLabel: string;
    points : Points[]; 
};

/* Container to build scatter plot with associated datum */
interface Points {
    x: number;
    y: number;
    d: PointData;
    svg?: any; 
};

interface GOData{
    evidence: string; 
    id: string; 
    term: string; 
}

interface PointData{
    fullName: string; 
    geneName: string;
    id: string;
    name: string; 
    GO: GOData[]; 

}

interface DatumPoints extends Points {
    datum: Record<string, string|number>
}

type transform = "log10" | "-log10" | "none";

export interface Selection{
    x1:number;
    x2:number; 
    y1:number;
    y2:number; 
}; 

interface GOIndexed{
    [go_id: string] : GOObject
}

interface GOObject{
    go: GOData
    proteins: string[]
}

export{ Points, PlotData, transform, PointData, GOData, GOIndexed};