code = `
import json

airfoilData = """1.0000     0.0013
0.9500     0.0114
0.9000     0.0208
0.8000     0.0375
0.7000     0.0518
0.6000     0.0636
0.5000     0.0724
0.4000     0.0780
0.3000     0.0788
0.2500     0.0767
0.2000     0.0726
0.1500     0.0661
0.1000     0.0563
0.0750     0.0496
0.0500     0.0413
0.0250     0.0299
0.0125     0.0215
0.0000     0.0000
0.0125     -0.0165
0.0250     -0.0227
0.0500     -0.0301
0.0750     -0.0346
0.1000     -0.0375
0.1500     -0.0410
0.2000     -0.0423
0.2500     -0.0422
0.3000     -0.0412
0.4000     -0.0380
0.5000     -0.0334
0.6000     -0.0276
0.7000     -0.0214
0.8000     -0.0150
0.9000     -0.0082
0.9500     -0.0048
1.0000     -0.0013
"""

def parseAirfoilData(airfoilData):
    airfoilData = airfoilData.splitlines()
    airfoilData = [line.split() for line in airfoilData]
    airfoilData = [[float(x) for x in line] for line in airfoilData]
    return airfoilData

json.dumps(parseAirfoilData(airfoilData))
`;

var lift = [];
var drag = [];
var countSim = 0;

var canvas = document.getElementById("fluid-sim-canvas");
var canvasContext = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight + 110;

canvas.focus();

var simulationHeight = 1.0;
var canvasScale = canvas.height / simulationHeight;
var simulationWidth = canvas.width / canvasScale;

const VELOCITY_U_FIELD = 0;
const VELOCITY_V_FIELD = 1;
const DENSITY_FIELD = 2;

var updateCount = 0;

function convertXCoordinate(x) {
    return x * canvasScale;
}

function convertYCoordinate(y) {
    return canvas.height - y * canvasScale;
}

class FluidSimulation {
    constructor(fluidDensity, gridWidth, gridHeight, cellSize) {
        this.fluidDensity = fluidDensity;
        this.gridWidth = gridWidth + 2;
        this.gridHeight = gridHeight + 2;
        this.totalCells = this.gridWidth * this.gridHeight;
        this.cellSize = cellSize;
        this.velocityU = new Float32Array(this.totalCells);
        this.velocityV = new Float32Array(this.totalCells);
        this.updatedVelocityU = new Float32Array(this.totalCells);
        this.updatedVelocityV = new Float32Array(this.totalCells);
        this.pressure = new Float32Array(this.totalCells);
        this.cellSolidity = new Float32Array(this.totalCells);
        this.markerDensity = new Float32Array(this.totalCells);
        this.updatedMarkerDensity = new Float32Array(this.totalCells);
        this.markerDensity.fill(1.0);
    }

    integrateGravity(timeStep, gravity) {
        var gridHeight = this.gridHeight;
        for (var i = 1; i < this.gridWidth; i++) {
            for (var j = 1; j < this.gridHeight - 1; j++) {
                if (this.cellSolidity[i * gridHeight + j] != 0.0 && this.cellSolidity[i * gridHeight + j - 1] != 0.0)
                    this.velocityV[i * gridHeight + j] += gravity * timeStep;
            }
        }
    }

    resolveIncompressibility(iterations, timeStep) {
        var gridHeight = this.gridHeight;
        var coefficient = (this.fluidDensity * this.cellSize) / timeStep;

        for (var iteration = 0; iteration < iterations; iteration++) {
            for (var i = 1; i < this.gridWidth - 1; i++) {
                for (var j = 1; j < this.gridHeight - 1; j++) {
                    if (this.cellSolidity[i * gridHeight + j] == 0.0) continue;

                    var totalSolidity = this.cellSolidity[i * gridHeight + j];
                    var solidLeft = this.cellSolidity[(i - 1) * gridHeight + j];
                    var solidRight = this.cellSolidity[(i + 1) * gridHeight + j];
                    var solidBelow = this.cellSolidity[i * gridHeight + j - 1];
                    var solidAbove = this.cellSolidity[i * gridHeight + j + 1];
                    totalSolidity = solidLeft + solidRight + solidBelow + solidAbove;
                    if (totalSolidity == 0.0) continue;

                    var divergence =
                        this.velocityU[(i + 1) * gridHeight + j] -
                        this.velocityU[i * gridHeight + j] +
                        this.velocityV[i * gridHeight + j + 1] -
                        this.velocityV[i * gridHeight + j];

                    var pressureAdjustment = -divergence / totalSolidity;
                    pressureAdjustment *= scene.relaxationFactor;
                    this.pressure[i * gridHeight + j] += coefficient * pressureAdjustment;

                    this.velocityU[i * gridHeight + j] -= solidLeft * pressureAdjustment;
                    this.velocityU[(i + 1) * gridHeight + j] += solidRight * pressureAdjustment;
                    this.velocityV[i * gridHeight + j] -= solidBelow * pressureAdjustment;
                    this.velocityV[i * gridHeight + j + 1] += solidAbove * pressureAdjustment;
                }
            }
        }
    }

    extrapolateBoundaries() {
        var gridHeight = this.gridHeight;
        for (var i = 0; i < this.gridWidth; i++) {
            this.velocityU[i * gridHeight] = this.velocityU[i * gridHeight + 1];
            this.velocityU[i * gridHeight + this.gridHeight - 1] = this.velocityU[i * gridHeight + this.gridHeight - 2];
        }
        for (var j = 0; j < this.gridHeight; j++) {
            this.velocityV[j] = this.velocityV[gridHeight + j];
            this.velocityV[(this.gridWidth - 1) * gridHeight + j] = this.velocityV[(this.gridWidth - 2) * gridHeight + j];
        }
    }

    sampleFluidField(x, y, field) {
        var gridHeight = this.gridHeight;
        var cellSize = this.cellSize;
        var inverseCellSize = 1.0 / cellSize;
        var halfCellSize = 0.5 * cellSize;

        x = Math.max(Math.min(x, this.gridWidth * cellSize), cellSize);
        y = Math.max(Math.min(y, this.gridHeight * cellSize), cellSize);

        var dx = 0.0;
        var dy = 0.0;

        var fieldData;

        switch (field) {
            case VELOCITY_U_FIELD:
                fieldData = this.velocityU;
                dy = halfCellSize;
                break;
            case VELOCITY_V_FIELD:
                fieldData = this.velocityV;
                dx = halfCellSize;
                break;
            case DENSITY_FIELD:
                fieldData = this.markerDensity;
                dx = halfCellSize;
                dy = halfCellSize;
                break;
        }

        var leftX = Math.min(Math.floor((x - dx) * inverseCellSize), this.gridWidth - 1);
        var interpolationX = (x - dx - leftX * cellSize) * inverseCellSize;
        var rightX = Math.min(leftX + 1, this.gridWidth - 1);

        var bottomY = Math.min(Math.floor((y - dy) * inverseCellSize), this.gridHeight - 1);
        var interpolationY = (y - dy - bottomY * cellSize) * inverseCellSize;
        var topY = Math.min(bottomY + 1, this.gridHeight - 1);

        var weightLeft = 1.0 - interpolationX;
        var weightBottom = 1.0 - interpolationY;

        var value =
            weightLeft * weightBottom * fieldData[leftX * gridHeight + bottomY] +
            interpolationX * weightBottom * fieldData[rightX * gridHeight + bottomY] +
            interpolationX * interpolationY * fieldData[rightX * gridHeight + topY] +
            weightLeft * interpolationY * fieldData[leftX * gridHeight + topY];

        return value;
    }

    averageU(i, j) {
        var gridHeight = this.gridHeight;
        var averageU =
            (this.velocityU[i * gridHeight + j - 1] +
                this.velocityU[i * gridHeight + j] +
                this.velocityU[(i + 1) * gridHeight + j - 1] +
                this.velocityU[(i + 1) * gridHeight + j]) *
            0.25;
        return averageU;
    }

    averageV(i, j) {
        var gridHeight = this.gridHeight;
        var averageV =
            (this.velocityV[(i - 1) * gridHeight + j] +
                this.velocityV[i * gridHeight + j] +
                this.velocityV[(i - 1) * gridHeight + j + 1] +
                this.velocityV[i * gridHeight + j + 1]) *
            0.25;
        return averageV;
    }

    advectVelocity(timeStep) {
        this.updatedVelocityU.set(this.velocityU);
        this.updatedVelocityV.set(this.velocityV);

        var gridHeight = this.gridHeight;
        var cellSize = this.cellSize;
        var halfCellSize = 0.5 * cellSize;

        for (var i = 1; i < this.gridWidth; i++) {
            for (var j = 1; j < this.gridHeight; j++) {
                updateCount++;

                // Advect u component
                if (
                    this.cellSolidity[i * gridHeight + j] != 0.0 &&
                    this.cellSolidity[(i - 1) * gridHeight + j] != 0.0 &&
                    j < this.gridHeight - 1
                ) {
                    var posX = i * cellSize;
                    var posY = j * cellSize + halfCellSize;
                    var currentU = this.velocityU[i * gridHeight + j];
                    var interpolatedV = this.averageV(i, j);
                    posX = posX - timeStep * currentU;
                    posY = posY - timeStep * interpolatedV;
                    currentU = this.sampleFluidField(posX, posY, VELOCITY_U_FIELD);
                    this.updatedVelocityU[i * gridHeight + j] = currentU;
                }
                // Advect v component
                if (
                    this.cellSolidity[i * gridHeight + j] != 0.0 &&
                    this.cellSolidity[i * gridHeight + j - 1] != 0.0 &&
                    i < this.gridWidth - 1
                ) {
                    var posX = i * cellSize + halfCellSize;
                    var posY = j * cellSize;
                    var interpolatedU = this.averageU(i, j);
                    var currentV = this.velocityV[i * gridHeight + j];
                    posX = posX - timeStep * interpolatedU;
                    posY = posY - timeStep * currentV;
                    currentV = this.sampleFluidField(posX, posY, VELOCITY_V_FIELD);
                    this.updatedVelocityV[i * gridHeight + j] = currentV;
                }
            }
        }

        this.velocityU.set(this.updatedVelocityU);
        this.velocityV.set(this.updatedVelocityV);
    }

    advectMarkerDensity(timeStep) {
        this.updatedMarkerDensity.set(this.markerDensity);

        var gridHeight = this.gridHeight;
        var cellSize = this.cellSize;
        var halfCellSize = 0.5 * cellSize;

        for (var i = 1; i < this.gridWidth - 1; i++) {
            for (var j = 1; j < this.gridHeight - 1; j++) {
                if (this.cellSolidity[i * gridHeight + j] != 0.0) {
                    var interpolatedU = (this.velocityU[i * gridHeight + j] + this.velocityU[(i + 1) * gridHeight + j]) * 0.5;
                    var interpolatedV = (this.velocityV[i * gridHeight + j] + this.velocityV[i * gridHeight + j + 1]) * 0.5;
                    var posX = i * cellSize + halfCellSize - timeStep * interpolatedU;
                    var posY = j * cellSize + halfCellSize - timeStep * interpolatedV;

                    this.updatedMarkerDensity[i * gridHeight + j] = this.sampleFluidField(posX, posY, DENSITY_FIELD);
                }
            }
        }
        this.markerDensity.set(this.updatedMarkerDensity);
    }

    simulateFluid(timeStep, gravity, iterations) {
        this.integrateGravity(timeStep, gravity);

        this.pressure.fill(0.0);
        // const simulationStartTime = performance.now();
        this.resolveIncompressibility(iterations, timeStep);
        this.extrapolateBoundaries();
        this.advectVelocity(timeStep);
        this.advectMarkerDensity(timeStep);
        // const simulationEndTime = performance.now();
        // const simulationDurationMillis = simulationEndTime - simulationStartTime;
        /*document.getElementById("resultDisplay").textContent =
          parseFloat(simulationDurationMillis).toFixed(2);*/
    }

    computeReynoldsNumber(chord) {
        var reynolds = 0.0;
        var gridHeight = this.gridHeight;
        var cellSize = this.cellSize;
        var cellPixels = cellSize * canvas.width / simulationWidth;
        var chordUnits = chord / cellPixels;
        scene.avgVelocity = 0.0;
        var dynamicViscosity = 1.81 * 10e-5;

        for (var i = 0; i < this.gridWidth; i++) {
            for (var j = 0; j < this.gridHeight; j++) {
                scene.avgVelocity = Math.max(scene.avgVelocity, Math.sqrt(this.velocityU[i * gridHeight + j] * this.velocityU[i * gridHeight + j] + this.velocityV[i * gridHeight + j] * this.velocityV[i * gridHeight + j]));
            }
        }

        let kinematicViscosity = dynamicViscosity / this.fluidDensity;
        reynolds = (scene.avgVelocity * chordUnits) / kinematicViscosity;
        return reynolds;
    }
}

var scene = {
    gravityForce: -0,
    fluidDensity: 1.225,
    gridResolution: 300,
    timeStep: 1.0 / 120.0,
    iterationCount: 500,
    frameCount: 0,
    relaxationFactor: 1.0,
    obstacleRadius: 0.15,
    simulationPaused: true,
    displayObstacle: false,
    displayStreamlines: false,
    displayVelocities: false,
    displayPressure: true,
    displaySmoke: true,
    fluidSimulation: null,
    obstacleX: 0,
    obstacleY: 0,
    inflowVelocity: 10.0,
    fluidRatio: 0.975,
    numberOfStreamlines: 10,
    streamLineLength: 0.05,
    avgVelocity: 0.0,
    maxAOA: 40,
    reset: false,
};

document.addEventListener("DOMContentLoaded", () => {
    document
        .getElementById("streamlines")
        .addEventListener("change", function () {
            scene.displayStreamlines = this.checked;
        });

    /*   document
        .getElementById("velocityButton")
        .addEventListener("change", function () {
          scene.displayVelocities = false;
        }); */

    document
        .getElementById("pressure")
        .addEventListener("change", function () {
            scene.displayPressure = this.checked;
        });

    document
        .getElementById("smoke")
        .addEventListener("change", function () {
            scene.displaySmoke = this.checked;
        });

    document
        .getElementById("overrelax")
        .addEventListener("change", function () {
            scene.relaxationFactor = this.checked ? 1.9 : 1.0;
            console.log(scene.relaxationFactor);
        });

    /*     var densityInput = document.getElementById("densityInput");
        densityInput.addEventListener("input", function () {
            scene.fluidDensity = this.value;
        });
 
        var resolutionInput = document.getElementById("resolutionInput");
 
        resolutionInput.addEventListener("input", function () {
            scene.gridResolution = this.value;
        }); */
});


function toggleSimulationStart() {
    var startStopButton = document.getElementById("startButton");
    if (scene.simulationPaused) startStopButton.innerHTML = "Stop";
    else startStopButton.innerHTML = "Run";
    scene.simulationPaused = !scene.simulationPaused;
}

function resetSimulation() {
    scene.reset = true;
}

// Init Pyodide
async function main() {
    let pyodide = await loadPyodide();
    return pyodide;
}
let pyodideReadyPromise = main();

let airfoilData;

async function evaluatePython() {
    let pyodide = await pyodideReadyPromise;
    try {
        airfoilData = pyodide.runPython(code);
        airfoilData = JSON.parse(airfoilData);
        console.log(airfoilData);
    } catch (err) {
        console.log(err);
    }
}

async function startApplication() {
    // let airfoilRaw = await fetchData(url);
    // console.log(airfoilRaw);
    await evaluatePython();
    console.log("Python evaluation completed, proceeding with the rest of the application.");
    console.log("Now executing further logic or functions that depend on airfoil data.");
    let pixelScale = canvas.width / 1.75;
    let chordLengthpx = pixelScale;
    // make airfoil data actual points on the canvas
    airfoilData = airfoilData.map((point) => [convertXCoordinate(point[0] * 0.3), convertYCoordinate(point[1] * 0.3)]);
    // move center of airfoil to center of canvas
    airfoilData = airfoilData.map((point) => [point[0] + (canvas.width / 2) - (chordLengthpx / 2), point[1] - canvas.height / 2]);
    // get centroid of airfoilData
    let centroid = calculateCentroid();

    let averageDistance = 0;
    // calculate average distance in grid cells between each airfoil point
    for (let j = 1; j < airfoilData.length; j++) {
        const point1 = airfoilData[j];
        const point2 = airfoilData[j - 1];
        averageDistance += Math.sqrt((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2);
    }
    averageDistance /= airfoilData.length;

    function calculateCentroid() {
        let centroid = [0, 0];
        for (let i = 0; i < airfoilData.length; i++) {
            centroid[0] += airfoilData[i][0];
            centroid[1] += airfoilData[i][1];
        }
        centroid[0] /= airfoilData.length;
        centroid[1] /= airfoilData.length;
        return centroid;
    }

    function setSolidityCondition() {
        var gridHeight = scene.fluidSimulation.gridHeight;

        var inflowVelocity = scene.inflowVelocity;
        for (var i = 0; i < scene.fluidSimulation.gridWidth; i++) {
            for (var j = 0; j < scene.fluidSimulation.gridHeight; j++) {
                var solidity = 1.0; // Default to fluid
                if (i == 0 || j == 0 || j == scene.fluidSimulation.gridHeight - 1) solidity = 0.0; // Set boundary cells to solid
                scene.fluidSimulation.cellSolidity[i * gridHeight + j] = solidity;

                if (i == 1) {
                    scene.fluidSimulation.velocityU[i * gridHeight + j] = inflowVelocity;
                }
            }
        }
    }

    function setupScene() {
        var domainHeight = 1.0;
        var domainWidth = (domainHeight / simulationHeight) * simulationWidth;
        var cellSize = domainHeight / scene.gridResolution;

        var gridWidth = Math.floor(domainWidth / cellSize);
        var gridHeight = Math.floor(domainHeight / cellSize);

        var fluidDensity = scene.fluidDensity;

        scene.fluidSimulation = new FluidSimulation(fluidDensity, gridWidth, gridHeight, cellSize);

        setSolidityCondition();

        var pipeHeight = scene.fluidRatio * scene.fluidSimulation.gridHeight;
        var minJ = Math.floor(0.5 * scene.fluidSimulation.gridHeight - 0.5 * pipeHeight);
        var maxJ = Math.floor(0.5 * scene.fluidSimulation.gridHeight + 0.5 * pipeHeight);

        for (var j = minJ; j < maxJ; j++) {
            scene.fluidSimulation.markerDensity[j] = 0.0;  // Make sure indexing is correct for a 2D context
        }

        averageDistance /= (scene.fluidSimulation.cellSize * canvas.width / simulationWidth);
        console.log("Average Distance: ", averageDistance)

        // setObstacle(0.5, 0.5);  // Assuming setObstacle function takes parameters for the center of the obstacle in normalized domain coordinates
        setObstacleAirfoil();
    }

    function getScientificColor(value, minValue, maxValue) {
        // Clamp the value between minValue and just below maxValue
        const clampedValue = Math.min(Math.max(value, minValue), maxValue - 0.0001);
        const range = maxValue - minValue;

        // Normalize the value within the range
        const normalizedValue = range === 0.0 ? 0.5 : (clampedValue - minValue) / range;
        const segmentWidth = 0.25;
        const segmentIndex = Math.floor(normalizedValue / segmentWidth);
        const segmentProgress = (normalizedValue - segmentIndex * segmentWidth) / segmentWidth;

        let red, green, blue;

        // Calculate RGB values based on the current segment
        switch (segmentIndex) {
            case 0:
                red = 0.0;
                green = segmentProgress;
                blue = 1.0;
                break;
            case 1:
                red = 0.0;
                green = 1.0;
                blue = 1.0 - segmentProgress;
                break;
            case 2:
                red = segmentProgress;
                green = 1.0;
                blue = 0.0;
                break;
            case 3:
                red = 1.0;
                green = 1.0 - segmentProgress;
                blue = 0.0;
                break;
        }

        // Convert to RGBA values on a scale of 0-255 and return
        // TODO: Swap Green for another color
        return [red * 255, green * 255, blue * 255, 255];
    }

    function drawSimulation() {
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);

        canvasContext.fillStyle = "#FF0000";
        let fluid = scene.fluidSimulation;
        let gridHeight = fluid.gridHeight;

        var cellScale = 1.1;

        var cellSize = fluid.cellSize;

        var minPressure = fluid.pressure[0];
        var maxPressure = fluid.pressure[0];

        for (var i = 0; i < fluid.totalCells; i++) {
            minPressure = Math.min(minPressure, fluid.pressure[i]);
            maxPressure = Math.max(maxPressure, fluid.pressure[i]);
        }

        let imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);

        var color = [255, 255, 255, 255];

        for (var i = 0; i < fluid.gridWidth; i++) {
            for (var j = 0; j < fluid.gridHeight; j++) {
                if (scene.displayPressure) {
                    var pressure = fluid.pressure[i * gridHeight + j];
                    var smokeDensity = fluid.markerDensity[i * gridHeight + j];
                    color = getScientificColor(pressure, minPressure, maxPressure);
                    if (scene.displaySmoke) {
                        color[0] = Math.max(0.0, color[0] - 255 * smokeDensity);
                        color[1] = Math.max(0.0, color[1] - 255 * smokeDensity);
                        color[2] = Math.max(0.0, color[2] - 255 * smokeDensity);
                    }
                } else if (scene.displaySmoke) {
                    var smokeDensity = fluid.markerDensity[i * gridHeight + j];
                    color[0] = 255 * smokeDensity;
                    color[1] = 255 * smokeDensity;
                    color[2] = 255 * smokeDensity;
                } else if (fluid.cellSolidity[i * gridHeight + j] == 0.0) {
                    color[0] = 0;
                    color[1] = 0;
                    color[2] = 0;
                }

                var x = Math.floor(convertXCoordinate(i * cellSize));
                var y = Math.floor(convertYCoordinate((j + 1) * cellSize));
                var cellWidth = Math.floor(canvasScale * cellScale * cellSize) + 1;
                var cellHeight = Math.floor(canvasScale * cellScale * cellSize) + 1;

                setPixelColor(imageData, x, y, cellWidth, cellHeight, color);
            }
        }

        canvasContext.putImageData(imageData, 0, 0);

        if (scene.displayVelocities) {
            canvasContext.strokeStyle = "#000000";
            let velocityScale = 0.02;

            for (var i = 0; i < fluid.gridWidth; i++) {
                for (var j = 0; j < fluid.gridHeight; j++) {
                    var horizontalVelocity = fluid.velocityU[i * gridHeight + j];
                    var verticalVelocity = fluid.velocityV[i * gridHeight + j];

                    drawVelocityVector(i, j, horizontalVelocity, verticalVelocity, velocityScale);
                }
            }
        }

        if (scene.displayStreamlines) {
            drawStreamlines(fluid, scene.streamLineLength, scene.numberOfStreamlines);
        }

        if (scene.displayObstacle) {
            drawObstacle(scene.obstacleX, scene.obstacleY, scene.obstacleRadius + fluid.cellSize);
        }

        if (scene.displayPressure) {
            displayPressureRange(minPressure, maxPressure);
        }
        // print reynolds number in top right corner in bold
        canvasContext.fillStyle = "black";
        canvasContext.font = "bold 48px Arial";
        canvasContext.fillText("Reynolds Number: " + fluid.computeReynoldsNumber(chordLengthpx).toFixed(2), 20, 50);

        //drawArrow(obstacleCenterX, obstacleCenterY, -forces.totalDrag, -forces.totalLift, 'red');
        draw_airfoil(airfoilData);
        // draw circle at centroid
        draw_centroid();
        //testIsPointInsideAirfoil();

        // Compute forces on airfoil
        const forcesAirfoil = computeTotalLiftAndDragAirfoil(scene.fluidSimulation);
        if (countSim % 10 == 0 && countSim > 30) {
            // add lift and drag forces to lift and drag arrays
            lift.push(-forcesAirfoil.totalLift);
            drag.push(-forcesAirfoil.totalDrag);
        }
        // draw forces on airfoil
        drawArrow(centroid[0], centroid[1], forcesAirfoil.totalDrag, forcesAirfoil.totalLift, 'blue');
    }

    function computeTotalLiftAndDrag(fluid) {
        const obstacleCenterX = scene.obstacleX;
        const obstacleCenterY = scene.obstacleY;
        const radius = scene.obstacleRadius;
        const gridHeight = fluid.gridHeight;

        let totalLift = 0;
        let totalDrag = 0;

        // Estimate the force components over a circle around the obstacle
        const numPoints = 360;
        const dTheta = (2 * Math.PI) / numPoints;

        for (let point = 0; point < numPoints; point++) {
            const theta = point * dTheta;
            const pointX = obstacleCenterX + radius * Math.cos(theta);
            const pointY = obstacleCenterY + radius * Math.sin(theta);

            const gridX = Math.floor(pointX / fluid.cellSize);
            const gridY = Math.floor(pointY / fluid.cellSize);

            if (gridX < 0 || gridX >= fluid.gridWidth || gridY < 0 || gridY >= fluid.gridHeight) continue;

            const pressure = fluid.pressure[gridX * gridHeight + gridY];

            // Decompose pressure into lift and drag components
            totalDrag += pressure * Math.cos(theta) * dTheta * radius;
            totalLift += pressure * Math.sin(theta) * dTheta * radius;
        }

        return { totalLift: totalLift * fluid.cellSize, totalDrag: totalDrag * fluid.cellSize };
    }

    function computeTotalLiftAndDragAirfoil(fluid) {
        let totalLift = 0;
        let totalDrag = 0;

        // Compute the force components over the airfoil using the pressure at the surface points
        for (let i = 0; i < airfoilData.length; i++) {
            // scale airfoil points by a percentage from the cetroid
            let newAirfoilPoints = airfoilData.map((point) => {
                return [
                    centroid[0] + (point[0] - centroid[0]) * 1.1,
                    centroid[1] + (point[1] - centroid[1]) * 1.1,
                ];
            });
            const point = newAirfoilPoints[i];

            // get gridx and grid y closest to pixel on canvas
            const gridX = Math.floor((point[0] / canvas.width) * fluid.gridWidth);
            const gridY = Math.floor((point[1] / canvas.height) * fluid.gridHeight);

            /*             canvasContext.save();
                        canvasContext.fillStyle = isPointInsideAirfoil(point) ? "red" : "green";
                        // draw circle at airfoil points
                        canvasContext.beginPath();
                        canvasContext.arc(point[0], point[1], 5, 0, 2 * Math.PI);
                        canvasContext.fill();
                        canvasContext.stroke();
                        canvasContext.restore(); */

            // if (gridX < 0 || gridX >= fluid.gridWidth || gridY < 0 || gridY >= fluid.gridHeight) continue;

            var pressure = fluid.pressure[gridX * fluid.gridHeight + gridY];
            // if pressure is undefined, set to 0
            if (isNaN(pressure)) {
                pressure = 0;
            }

            // calculate the angle between the point and the centroid
            const dx = point[0] - centroid[0];
            const dy = point[1] - centroid[1];
            const theta = Math.atan2(dy, dx);

            // Decompose pressure into lift and drag components
            totalDrag += pressure * Math.sin(theta) * averageDistance;
            totalLift += pressure * Math.cos(theta) * averageDistance;
        }

        return { totalLift: totalLift, totalDrag: totalDrag };
    }

    function drawVelocityVector(i, j, horizontalVelocity, verticalVelocity, velocityScale) {
        const startX = convertXCoordinate(i * scene.fluidSimulation.cellSize);
        const startY = convertYCoordinate((j + 0.5) * scene.fluidSimulation.cellSize);
        const endX = startX + horizontalVelocity * velocityScale * canvasScale;
        const endY = startY - verticalVelocity * velocityScale * canvasScale; // Subtract because canvas y is top-down

        canvasContext.beginPath();
        canvasContext.moveTo(startX, startY);
        canvasContext.lineTo(endX, startY); // Horizontal line for U
        canvasContext.stroke();

        canvasContext.beginPath();
        canvasContext.moveTo(startX, startY);
        canvasContext.lineTo(startX, endY); // Vertical line for V
        canvasContext.stroke();
    }

    function drawStreamlines(fluid, segmentLength, numSegments) {
        for (let i = 1; i < fluid.gridWidth - 1; i += 5) {
            for (let j = 1; j < fluid.gridHeight - 1; j += 5) {
                let x = i * fluid.cellSize + 0.5 * fluid.cellSize;
                let y = j * fluid.cellSize + 0.5 * fluid.cellSize;

                canvasContext.beginPath();
                canvasContext.moveTo(convertXCoordinate(x), convertYCoordinate(y));

                for (let n = 0; n < numSegments; n++) {
                    let u = fluid.sampleFluidField(x, y, VELOCITY_U_FIELD);
                    let v = fluid.sampleFluidField(x, y, VELOCITY_V_FIELD);
                    x += u * segmentLength;
                    y += v * segmentLength;

                    canvasContext.lineTo(convertXCoordinate(x), convertYCoordinate(y));
                }
                canvasContext.stroke();
            }
        }
    }

    function drawObstacle(x, y, radius) {
        const centerX = convertXCoordinate(x);
        const centerY = convertYCoordinate(y);
        const obstacleRadius = radius * canvasScale;

        // canvasContext.fillStyle = scene.displayPressure ? "#000000" : "#DDDDDD";
        canvasContext.beginPath();
        canvasContext.arc(centerX, centerY, obstacleRadius, 0, 2 * Math.PI);
        canvasContext.fill();
        canvasContext.stroke();
    }

    function displayPressureRange(minPressure, maxPressure) {
        canvasContext.fillStyle = "black";
        canvasContext.font = "bold 48px Arial";
        canvasContext.fillText(`Pressure range: ${minPressure.toFixed(2)} - ${maxPressure.toFixed(2)}`, 20, 120);
    }

    function draw_airfoil(points) {
        if (points) {
            canvasContext.save();
            canvasContext.strokeStyle = "#ffffff";
            canvasContext.lineWidth = 10;
            // Draw a line between each point from the airfoil data
            canvasContext.beginPath();
            canvasContext.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) {
                canvasContext.lineTo(points[i][0], points[i][1]);
            }
            canvasContext.stroke();
            canvasContext.closePath();
            canvasContext.fillStyle = "#ffffff";
            canvasContext.fill();
            canvasContext.restore();
        }
    }

    var prevMaxArrowLength = 0;
    function drawArrow(startX, startY, forceX, forceY, color) {
        canvasContext.save();

        // Calculate the arrow length as a fraction of the canvas diagonal for relative scaling
        const canvasDiagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
        const arrowLength = Math.sqrt(forceX * forceX + forceY * forceY);
        // use previous max arrow length to scale arrow length
        const maxArrowLength = Math.max(prevMaxArrowLength, arrowLength);
        prevMaxArrowLength = maxArrowLength;

        // Ensure a minimum length for visibility
        const minLength = 0; // 5% of the smaller dimension
        const scaledLength = Math.max(minLength, arrowLength / maxArrowLength * canvasDiagonal * 0.5);

        // Calculate the direction of the arrow
        const angle = Math.atan2(forceY, forceX);

        // Calculate the end point of the arrow
        const endX = startX + scaledLength * -Math.cos(angle);
        const endY = startY - scaledLength * -Math.sin(angle); // Y axis is inverted in canvas

        // Draw the line for the arrow
        if (scaledLength > 0) {
            canvasContext.beginPath();
            canvasContext.moveTo(startX, startY);
            canvasContext.lineTo(endX, endY);
            canvasContext.strokeStyle = color;
            canvasContext.lineWidth = 12; // Adjust line width if necessary
            canvasContext.stroke();
            canvasContext.closePath();
        }

        canvasContext.restore();
    }

    function draw_centroid() {
        canvasContext.save();
        canvasContext.beginPath();
        canvasContext.arc(centroid[0], centroid[1], 5, 0, 2 * Math.PI);
        canvasContext.fillStyle = "red";
        canvasContext.fill();
        canvasContext.stroke();
        canvasContext.restore();
    }

    function setPixelColor(imageData, x, y, width, height, color) {
        for (let yi = y; yi < y + height; yi++) {
            for (let xi = x; xi < x + width; xi++) {
                let index = 4 * (yi * imageData.width + xi);
                imageData.data[index] = color[0];     // Red
                imageData.data[index + 1] = color[1]; // Green
                imageData.data[index + 2] = color[2]; // Blue
                imageData.data[index + 3] = 255;      // Alpha
            }
        }
    }

    function setObstacle(x, y) {
        var horizontalVelocity = 0.0;
        var verticalVelocity = 0.0;

        scene.obstacleX = x;
        scene.obstacleY = y;
        var obstacleRadius = scene.obstacleRadius;
        var fluid = scene.fluidSimulation;
        var gridHeight = fluid.gridHeight;
        var cellDiagonal = Math.sqrt(2) * fluid.cellSize;

        for (var i = 1; i < fluid.gridWidth - 2; i++) {
            for (var j = 1; j < fluid.gridHeight - 2; j++) {
                fluid.cellSolidity[i * gridHeight + j] = 1.0;

                var dx = (i + 0.5) * fluid.cellSize - x;
                var dy = (j + 0.5) * fluid.cellSize - y;

                if (dx * dx + dy * dy < obstacleRadius * obstacleRadius) {
                    fluid.cellSolidity[i * gridHeight + j] = 0.0;
                    fluid.markerDensity[i * gridHeight + j] = 1.0;
                    fluid.velocityU[i * gridHeight + j] = horizontalVelocity;
                    fluid.velocityU[(i + 1) * gridHeight + j] = horizontalVelocity;
                    fluid.velocityV[i * gridHeight + j] = verticalVelocity;
                    fluid.velocityV[i * gridHeight + j + 1] = verticalVelocity;
                }
            }
        }
    }

    function setObstacleAirfoil() {
        var horizontalVelocity = 0.0;
        var verticalVelocity = 0.0;

        var fluid = scene.fluidSimulation;
        var gridHeight = fluid.gridHeight;
        // set all points cell points inside airfoil to solid using isPointInsideAirfoil
        for (var i = 1; i < fluid.gridWidth - 2; i++) {
            for (var j = 1; j < fluid.gridHeight - 2; j++) {
                var x = i * fluid.cellSize + 0.5 * fluid.cellSize;
                var y = j * fluid.cellSize + 0.5 * fluid.cellSize;
                // draw small circle at every cell point
                /*                 canvasContext.beginPath();
                                canvasContext.arc(convertXCoordinate(x), convertYCoordinate(y), 5, 0, 2 * Math.PI);
                                canvasContext.fillStyle = isPointInsideAirfoil(convertXCoordinate(x), convertYCoordinate(y)) ? "green" : "red";
                                canvasContext.fill();
                                canvasContext.stroke(); */
                if (isPointInsideAirfoil(convertXCoordinate(x), convertYCoordinate(y))) {
                    fluid.cellSolidity[i * gridHeight + j] = 0.0;
                    fluid.markerDensity[i * gridHeight + j] = 1.0;
                    fluid.velocityU[i * gridHeight + j] = horizontalVelocity;
                    fluid.velocityU[(i + 1) * gridHeight + j] = horizontalVelocity;
                    fluid.velocityV[i * gridHeight + j] = verticalVelocity;
                    fluid.velocityV[i * gridHeight + j + 1] = verticalVelocity;
                }
            }
        }
    }

    function isPointInsideAirfoil(x, y) {
        var inside = false;
        for (var i = 0, j = airfoilData.length - 1; i < airfoilData.length; j = i++) {
            var xi = airfoilData[i][0], yi = airfoilData[i][1];
            var xj = airfoilData[j][0], yj = airfoilData[j][1];

            var intersect = ((yi > y) != (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    function testIsPointInsideAirfoil() {
        let centerX = canvas.width / 2 + 300;
        let centerY = canvas.height / 2 + 20;
        let radius = 25;
        let x = centerX + 402;
        let y = centerY - 207;

        canvasContext.beginPath();
        canvasContext.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        canvasContext.fillStyle = isPointInsideAirfoil(centerX, centerY) ? "green" : "red";
        canvasContext.fill();
        canvasContext.stroke();

        canvasContext.beginPath();
        canvasContext.arc(x, y, radius, 0, 2 * Math.PI);
        canvasContext.fillStyle = isPointInsideAirfoil(x, y) ? "green" : "red";
        canvasContext.fill();
        canvasContext.stroke();
    }

    function rotateAirfoilAroundPoint(angleOfAttack, centerX, centerY) {
        for (let i = 0; i < airfoilData.length; i++) {
            let x = airfoilData[i][0];
            let y = airfoilData[i][1];
            let xRotated = centerX + (x - centerX) * Math.cos(angleOfAttack) - (y - centerY) * Math.sin(angleOfAttack);
            let yRotated = centerY + (x - centerX) * Math.sin(angleOfAttack) + (y - centerY) * Math.cos(angleOfAttack);
            airfoilData[i] = [xRotated, yRotated];
        }
    }

    function rotateAirfoilAroundPointDegrees(angleOfAttack, centerX, centerY) {
        rotateAirfoilAroundPoint((angleOfAttack * Math.PI) / 180, centerX, centerY);
    }

    var aoaData = [];
    var aoa = 0;
    var aoaIncrementDeg = 0.1;
    var maxAOA = scene.maxAOA;
    function runSimulation() {
        if (!scene.simulationPaused) {
            scene.fluidSimulation.simulateFluid(scene.timeStep, scene.gravityForce, scene.iterationCount);
            if (aoa < maxAOA) {
                rotateAirfoilAroundPointDegrees(aoaIncrementDeg, centroid[0], centroid[1]);
                aoa += aoaIncrementDeg;
            }
            centroid = calculateCentroid();
            setSolidityCondition();
            setObstacleAirfoil();
            if (countSim % 10 == 0 && countSim > 30) {
                aoaData.push(aoa);

                var cl = get_coefficient_lift(lift, scene.fluidDensity, scene.inflowVelocity);
                var cd = get_coefficient_drag(drag, scene.fluidDensity, scene.inflowVelocity);
                console.log("CL: ", cl, "CD: ", cd);
                data = [plot_data(cd, cl, (color = "red"))];
                plot("plot1", data, "Drag Polar", "Coefficient of Drag", "Coefficient of Lift");

                data = [plot_data(aoaData, cl, (color = "green"))];
                plot("plot2", data, "AOA vs. CL", "AOA", "Coefficient of Lift");

                data2 = [plot_data(aoaData, cd, (color = "blue"))];
                plot("plot3", data2, "AOA vs. CD", "AOA", "Coefficient of Drag");
            }
            countSim++;
        } else {
            if (scene.reset) {
                scene.frameCount = 0;
                lift = [];
                drag = [];
                aoaData = [];
                rotateAirfoilAroundPointDegrees(-aoa, centroid[0], centroid[1]);
                aoa = 0;
                setupScene();
                scene.reset = false;
                // clear plotly plots
                document.getElementById("plot1").innerHTML = "";
                document.getElementById("plot2").innerHTML = "";
                document.getElementById("plot3").innerHTML = "";
            }
        }
        scene.frameCount++;
    }

    function updateSimulation() {
        runSimulation();
        drawSimulation();
        requestAnimationFrame(updateSimulation);
    }

    setupScene();
    updateSimulation();

    window.addEventListener("resize", function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight + 110;
        canvasScale = canvas.height / simulationHeight;
        simulationWidth = canvas.width / canvasScale;
        drawSimulation();
    });

}

startApplication();