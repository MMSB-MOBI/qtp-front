
interface State{
    xlsDisplayed: boolean; 
}

export const states = {
    namespaced: true,
    state: {
        xlsDisplayed: false
    } as State,

    mutations: {
        mutateXlsDisplayed(state: State, status:boolean){
            state.xlsDisplayed = status
        }
    }
}