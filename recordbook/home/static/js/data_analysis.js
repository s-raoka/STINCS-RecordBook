$(function() {
    var designs = {{ designs|safe }};
    for (i = 0; i < designs.length; i++) {
        var option = "<option value=" + i + ">" + designs[i]["fields"].name + "</option>";
        $("#designs").append(option);
    };
});

$("#designs").change(function() {
    var designs = {{ designs|safe }};
    var flights = {{ flights|safe }};
    var designKey = $(this).val();

    if (designKey == "blank") {
        $(".chart-container").empty();
        $(".chart-container").append('<canvas id="mass-altitude"></canvas>');
        return;
    };

    var design = designs[designKey];
    var designFlights = JSON.parse(flights[designKey]);

    if (designFlights.length < 2) {
        $(".chart-container").empty();
        $(".chart-container").append('<canvas id="mass-altitude"></canvas>');
        $("#select-design").append('<p id="not-enough-flights">Please log more flights for this design to analyze its data</p>')
        return;
    };
    // make sure we don't display not enough flights if there are 2+
    $("#not-enough-flights").remove();

    var flightPoints = [];  // chart uses [{x: x, y: y}]
    var trendlinePoints = [];  // trendline uses [[x, y]]
    for (i = 0; i < designFlights.length; i++) {
        let point = {};
        x = designFlights[i]["fields"].total_mass;
        y = designFlights[i]["fields"].altitude;
        point.x = parseFloat(x);
        point.y = parseFloat(y);
        flightPoints.push(point);
        trendlinePoints.push([parseFloat(point.x), point.y]);
    };

    // sort trendlinePoints in order of increasing mass
    trendlinePoints.sort(function(p1, p2) {
        m1 = p1[0];
        m2 = p2[0];
        if (m1 > m2) return 1;
        if (m1 < m2) return -1;
        return 0;
    });

    // now calculate trendline based on those points
    var trendline = regression.linear(trendlinePoints);
    var xmin = Math.round(trendlinePoints[0][0] - 2);
    var xmax = Math.round(trendlinePoints[trendlinePoints.length - 1][0] + 2);
    var trendline_endpoints = [
        {x: xmin, y: trendline.predict(xmin)[1]},
        {x: xmax - 1, y: trendline.predict(xmax - 1)[1]}
    ];

    var ctx = $("#mass-altitude");
    massAltitudeChart = new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: [
            {
                label: design["fields"].name + ": raw data",
                data: flightPoints,
                pointRadius: 5,
                pointBackgroundColor: "#6CADDF",
                backgroundColor: "#6CADDF"
            },
            {
                label: design["fields"].name + ": trendline " + trendline.string + " with R^2 = " + trendline.r2,
                data: trendline_endpoints,
                pointRadius: 0,
                type: "line",
                fill: false
            }]
        },
        options: {
            title: {
                display: true,
                fontSize: 18,
                text: design["fields"].name + " Mass to Altitude",
            },
            legend: {
                display: true,
            },
            scales: {
                xAxes: [{
                    type: "linear",
                    position: "bottom",
                    suggestedMin: xmin,
                    suggestedMax: xmax,
                    scaleLabel: {
                        display: true,
                        labelString: "Mass (g)",
                        fontSize: 16
                    }
                }],
                yAxes: [{
                    type: "linear",
                    position: "left",
                    scaleLabel: {
                        display: true,
                        labelString: "Altitude (ft)",
                        fontSize: 16
                    }
                }]
            }
        }
    });
});
