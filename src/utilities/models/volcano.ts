type plotData = {
    x: number[];
    y: number[];
    xLabel: string;
    yLabel: string;
};

/* Container to build scatter plot with associated datum */
interface Points {
    x: number;
    y: number;
    d?: PointData;
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


export{ Points, plotData, transform};