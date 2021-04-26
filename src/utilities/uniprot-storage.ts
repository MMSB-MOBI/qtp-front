

interface UniprotDatum {
    name?: string;
    GO?: Map<string, string>[];
    id: string;
    geneName?: string;
    fullName?: string;
    taxid?: string; 
}

type UniprotFetch = { [index: string]: UniprotDatum|null };

class UniprotStorage {
    data: UniprotFetch;
    providerURL: string|undefined

    constructor(url?: string){
        this.data = {}
        this.providerURL = url
    }

    private fetchFrom = async (uniprotIDs: string[]): Promise<UniprotFetch> => {
        //console.log(`ff Loading ${uniprotIDs.length} items ff`);
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
    public add = async (uniprotIDs : string[]): Promise<number> => {
        console.log("add"); 
        const uniprotData: UniprotFetch = await this.fetchFrom(uniprotIDs)
        console.log("fetched"); 
        return new Promise((res, rej) => {
            try{
                this.data = {...this.data, ...uniprotData}
                res(Object.keys(this.data).length)
            }
            catch (err) {
                rej(err)
            }
        })
    }

    public get = async(id : string): Promise<any> => {
        return new Promise((res, rej) => {
            try{
                const result = this.data[id]
                res(result)
            }
            catch(err){
                rej(err)

            }
        })
    }

}


let UNIPROT_DB:UniprotStorage|undefined = undefined

export const logDB = ():UniprotStorage => {
    if(!UNIPROT_DB) {
        UNIPROT_DB = new UniprotStorage()
        console.log("Create new uniprot db")
    }
    else console.log("Load uniprot db")
    
    return UNIPROT_DB
}
