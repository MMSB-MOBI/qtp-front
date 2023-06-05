import { csvParse } from "d3";
import { resolveComponent } from "vue";
import { UnigoGOObject, GOData } from '../types/volcano'
import { Proteome } from '../types/data'; 

interface UniprotDatum {
    name?: string;
    go: GOData[];
    unigoGO : UnigoGOObject[]; 
    id: string;
    gene_name?: string;
    full_name?: string;
    taxid?: string; 
}

interface UniprotFetch {
    found : { [index: string]: UniprotDatum }, 
    not_found : {contaminants : number, not_in_uniprot : string[], unformatted : string[]}
}

interface UnigoFetch {
    found : { [index: string]: UnigoGOObject[] }, 
    not_found : {contaminants : number, not_in_uniprot : string[], unformatted : string[]}
}

class UniprotStorage {
    data: UniprotFetch;
    proteome: Proteome; 
    providerURL: string|undefined

    constructor(url?: string){
        this.data = {found: {}, not_found : {contaminants : 0, not_in_uniprot: [], unformatted : []}}
        this.proteome = {name : '', proteins: []}
        this.providerURL = url
    }

    private fetchFromUniprot = async (uniprotIDs: string[]): Promise<UniprotFetch> => {
        //console.log(`ff Loading ${uniprotIDs.length} items ff`);
        console.log("try to fetch from uniprot", uniprotIDs.length)
        const response = await fetch(`${this.providerURL ? this.providerURL : ''}/api/uniprot/many`, {
            method: 'POST',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({'uniprotIDs' : uniprotIDs})
        });

        const uniprotData: UniprotFetch = await response.json();
        if (!uniprotData)
            throw("No data loaded");
    
        return uniprotData;        
    }

    // private fetchFromUnigo = async( uniprotIDs: string[], taxid:number) => {
    //     const response = await fetch(`${this.providerURL ? this.providerURL : ''}/api/unigo/trimmedVectorByProt`,{
    //         method: 'POST',
    //         headers: {
    //         'Accept': 'application/json',
    //         'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify({'uniprotIds' : uniprotIDs, "taxid": taxid})

    //     })
    //     const unigoData: UnigoFetch = await response.json(); 
    //     if (!unigoData)
    //         throw("No unigo data loaded");
        
    //     return unigoData
    // }

    private checkTaxids = async(uniprotData: UniprotFetch): Promise<Set<number>> => {
        return new Promise((resolve, reject) => {
            const setTaxid: Set<number> = new Set();
            Object.values(uniprotData.found).forEach(prot => {
                if(prot !== null)  setTaxid.add(Number(prot.taxid))
            })
            if (setTaxid.size === 1) resolve(setTaxid)
            else reject(setTaxid)
          })
    }

    public add = async (uniprotIDs : string[]): Promise<boolean> => {
        console.log("add", uniprotIDs.length)
        const uniprotData = await this.fetchFromUniprot(uniprotIDs); 
        const withAnnotationData : UnigoFetch = {found : {}, not_found : uniprotData.not_found}
        return new Promise((res,rej) => {
                try {
                    //This is dumb but I'm lazy for now
                Object.values(uniprotData.found).forEach(prot => {
                       
                        if(prot !== null) {
                            //@ts-ignore
                        withAnnotationData.found[prot.id] = prot
                            prot.unigoGO = []
                            prot.go.forEach(goObj => {
                                const test : UnigoGOObject = {ns : getNamespace(goObj.term), go : goObj.id, name : goObj.term}
                                prot.unigoGO.push(test); 
                            })
                            
                        }
                   })
                    //@ts-ignore
                    this.data = withAnnotationData
                    console.log("DATA", this.data)
                } catch(e) {
                    rej(e)
                }
                
                
                res(true)
                // this.fetchFromUnigo(uniprotIDs, finalTaxid).then(unigoData => {
                //    Object.entries(unigoData).forEach(([prot, goObj]) => {
                //         uniprotData[prot].unigoGO = goObj; 
                //    })
                //    this.data = {  ...this.data, ...uniprotData }
                //    res(true); 
                // }).catch(err => rej({"fetch unigo error": err}))
        })
    }

    public get = async(id : string): Promise<any> => {
        return new Promise((res, rej) => {
            try{
                console.log("get", id)
                const result = this.data.found[id]
                res(result)
            }
            catch(err){
                rej(err)

            }
        })
    }

    public registerProteome = async(proteome : Proteome) : Promise<boolean> => {
        return new Promise((res,rej) => { 
            try {
                this.proteome = proteome
            }
            catch(e){
                rej(e)
            }
        })
    }

    public length = async(): Promise<number> => {
        return Object.keys(this.data).length
    }

    public getAll = async(): Promise<string[]> => {
        return Object.keys(this.data.found)
    }

    public getUniprotNotFound = async() => {
        return this.data.not_found
    }



    /*public getGO = async(filterFn:(go: GOObject2) => Boolean): Promise<any> => {
        console.log("getGO"); 
        console.log(this.unigo_data); 
        const filtered = this.unigo_data.filter(go => filterFn(go))
        return filtered; 
    }*/



}


let UNIPROT_DB:UniprotStorage|undefined = undefined

const getNamespace = (goName : string) => {
    const firstLetter = goName.split(':')[0] 
    switch(firstLetter){
        case 'F': return "Molecular function" 
        case 'P' : return "Biological process"
        case 'C' : return "Cellular component"
        default : return "Unknown namespace"
    }
}

export const logDB = ():UniprotStorage => {
    if(!UNIPROT_DB) {
        UNIPROT_DB = new UniprotStorage()
        console.log("Create new uniprot db")
    }
    else console.log("Load uniprot db")
    
    return UNIPROT_DB
}
