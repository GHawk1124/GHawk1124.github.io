const { invoke } = window.__TAURI__.tauri;

fd = 1.225;
gw = 100;
gh = 100;
cs = 10.0;

invoke('sim_init', { fluidDensity: fd, gridWidth: gw, gridHeight: gh, cellSize: cs });

invoke('get_total_cells').then((totalCells) => {
    console.log(totalCells);
});