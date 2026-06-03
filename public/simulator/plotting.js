function get_coefficient_lift(lift, density, velocity) {
    var cl = new Array(lift.length).fill(0);
    velocity = velocity ** 2;
    for (i = 0; i < lift.length; i++) {
        cl[i] = lift[i] / (0.5 * density * velocity);
    }
    return cl;
}

function get_coefficient_drag(drag, density, velocity) {
    var cd = new Array(drag.length).fill(0);
    velocity = velocity ** 2;
    for (i = 0; i < drag.length; i++) {
        cd[i] = drag[i] / (0.5 * density * velocity);
    }
    return cd;
}

function findMaxIndex(array) {
    let maxIndex = 0; // Start with the first index as the maximum
    let maxValue = array[0]; // Assume the first element is the max value

    for (let i = 1; i < array.length; i++) {
        if (array[i] > maxValue) {
            maxValue = array[i];
            maxIndex = i;
        }
    }
    return maxIndex;
}

function stallPointAnnotation(max_cl_index) {
    let stallPointAnnotation = {
        x: aoa[max_cl_index],
        y: cl[max_cl_index],
        opacity: 1,
        xref: "x",
        yref: "y",
        text: "<b>Stall point</b>",
        showarrow: true,
        arrowhead: 0,
        ax: 0,
        ay: -45,
        bgcolor: "rgb(50,50,50)",
        bordercolor: "black",
        borderwidth: 1.5,
        borderpad: 3,
        font: {
            size: 12,
            color: "white"
        },
    };
    return stallPointAnnotation;
}

function get_coefficient_pressure(pressure_diff, density, velocity) {
    var cd = new Array(drag.length).fill(0);
    for (i = 0; i < drag.length; i++) {
        velocity[i] = velocity[i] * velocity[i];
        cd[i] = pressure_diff[i] / (0.5 * density * velocity[i]);
    }
    return cd;
}
function plot_data(
    plot_x,
    plot_y,
    color = "rgb(219, 64, 82)",
    type = "scatter"
) {
    var plotting = {
        x: plot_x,
        y: plot_y,
        type: type,
        mode: "lines",
        line: {
            color: color,
        },
    };
    return plotting;
}

function plot(div, data, title_str, x_axis, y_axis, max_stall = false) {
    let annotation = [];
    if (max_stall !== false) {
        max_cl_index = findMaxIndex(data[0]['y']);
        annotation = [stallPointAnnotation(max_cl_index)];
    }
    var layout = {
        title: {
            text: '<b>' + title_str + '</b>',
            font: {
                color: "rgb(0,0,0)",
            },
        },
        plot_bgcolor: "rgb(255,255,255)",
        paper_bgcolor: "rgb(255, 255, 255)",
        xaxis: {
            color: "rgb(0,0,0)",
            ticks: "inside",
            title: {
                text: x_axis,
                standoff: 10,
            },
            gridcolor: "rgb(0,0,0)",
            linecolor: "rgb(0,0,0)",
            tickcolor: "rgb(0,0,0)",
            mirror: "all",
        },
        yaxis: {
            color: "rgb(0,0,0)",
            ticks: "inside",
            title: {
                text: y_axis,
                standoff: 10,
            },
            gridcolor: "rgb(0,0,0)",
            linecolor: "rgb(0,0,0)",
            tickcolor: "rgb(0,0,0)",
            mirror: "all",
        },

        margin: {
            l: 100,
        },
        coloraxis: {
            colorbar: {
                bgcolor: "rgb(0,0,0)",
            },
        },
        annotations: annotation,
    };
    Plotly.newPlot(div, data, layout);
}

function currentPlots() {
    plot("plot1", data, "Drag Polar", "Coefficient of Drag", "Coefficient of Lift");
    plot("plot2", data2, "AOA vs. CL", "Angle of Attack", "Coefficient of Lift", max_stall = true);
    plot("plot3", data3, "AOA vs. CD", "Angle of Attack", "Coefficient of Drag");
    // plot("plot4", data4, "Cp", "x/c", "Cp");
}

function flushPlots() {
    document.getElementById("plot1").innerHTML = "";
    document.getElementById("plot2").innerHTML = "";
    document.getElementById("plot3").innerHTML = "";
    document.getElementById("plot4").innerHTML = "";
    Plotly.deleteTraces("plot1", 0);
    Plotly.deleteTraces("plot2", 0);
    Plotly.deleteTraces("plot3", 0);
    Plotly.deleteTraces("plot4", 0);
}

document.addEventListener("DOMContentLoaded", function () {
    // currentPlots();
});

// replot on resize
window.onresize = function () {
    currentPlots();
};

// replot on fullscreen
document.addEventListener("fullscreenchange", function () {
    currentPlots();
});