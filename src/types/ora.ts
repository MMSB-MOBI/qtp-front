export interface PwasAPIInput{
    proteinsExp : string[], 
    proteinsDelta : string[], 
    taxid: number, 
    method: StatMethod,
    pvalue: number
}

type StatMethod = "fisher"