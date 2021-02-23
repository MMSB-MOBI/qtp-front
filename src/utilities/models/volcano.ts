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
    d?: string|number|Object|unknown;
};

//TO DO : Determine type d

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