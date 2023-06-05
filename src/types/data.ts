export interface Proteome {
    name: string;
    proteins: string[];
  }

export interface UniprotFetchNotFound {
    contaminants : number, 
    not_in_uniprot : string[], 
    unformatted : string[]
}