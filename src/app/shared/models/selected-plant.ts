
export interface SelectedPlant {

    selectedModalKey: string;
    activePlantKey: string;
    activePlantName: string;
    activePlantColor: string;
    currentZone: string | null;

}

export const DEFAULT_SELECTED_PLANT: SelectedPlant = {
    selectedModalKey: "tomato",
    activePlantKey: "tomato",
    activePlantName: "Tomato",
    activePlantColor: "#ff6b6b",
    currentZone: null
};