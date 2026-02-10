// Load the dataset
d3.csv('continent_data.csv').then(function(data) {
    // Parse data
    data.forEach(d => {
        d['Number of Disasters'] = +d['Number of Disasters'];
        d['Year'] = +d['Year'];
        d['Annual CO2 emissions'] = +d['Annual CO2 emissions']; // Parse the CO2 emissions
    });

    // Define the color mapping for continents
    const colorMapping = {
        "Africa": "#FE94B4",
        "Asia": "#FEE552",
        "Europe": "#A1C740",
        "Americas": "#E75C38",
        "Oceania": "#60CCEC"
    };

    // Define a fixed order for continents
    const continentOrder = ["Asia", "Europe", "Africa", "Oceania", "Americas"];

    // Calculate the global maximum CO2 emissions across all years
    const globalMaxCO2 = d3.max(data, d => d['Annual CO2 emissions']);
    console.log("Global max CO2:", globalMaxCO2); // Check the global maximum CO2

    // Initialize the chart for the first year
    const initialYear = 2000;
    updateChart(initialYear, data, continentOrder, colorMapping, globalMaxCO2);

    // Update the chart when the slider is changed
    d3.select("#yearSlider").on("input", function() {
        const selectedYear = +this.value;
        d3.select("#yearLabel").text(selectedYear);
        updateChart(selectedYear, data, continentOrder, colorMapping, globalMaxCO2);
    });

    // Create the legend only once
    createLegend(continentOrder, colorMapping);
});

// Function to update the chart based on the selected year
function updateChart(selectedYear, data, continentOrder, colorMapping, globalMaxCO2) {
    // Filter the data for the selected year
    const filteredData = data.filter(d => d.Year === selectedYear);

    // Prepare data for the donut chart
    const chartData = continentOrder.map(continent => {
        const entry = filteredData.find(d => d.Continent === continent);
        return {
            continent: continent,
            disasters: entry ? entry['Number of Disasters'] : 0,
            co2: entry ? entry['Annual CO2 emissions'] : 0 
        };
    });

    const radius = 220; 
    const innerRadius = 75; 

    const svg = d3.select("#chart").html("").append("svg")
        .attr("width", radius * 2.5) 
        .attr("height", radius * 2.5) 
        .append("g")
        .attr("transform", `translate(${radius * 1.25}, ${radius * 1.25})`); 

    // Add a title for the CO2 emissions
    svg.append("text")
        .attr("x", 0)
        .attr("y", radius - 2) 
        .attr("text-anchor", "middle")
        .attr("font-size", "14px") 
        .attr("fill", "black")
        .text("CO2 Emissions in Billions of Tonnes");

    // Define circle values for CO2 emissions axis
    const circleValues = [
        globalMaxCO2 * 0.25,
        globalMaxCO2 * 0.5,
        globalMaxCO2 * 0.75
    ];

    // Add circles to represent CO2 emissions axis behind the chart
    svg.selectAll("circle")
        .data(circleValues)
        .enter().append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", d => innerRadius + (radius - innerRadius) * (d / globalMaxCO2))
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1);

    // Add labels to the last four circles
    svg.selectAll(".circle-label")
        .data(circleValues)
        .enter().append("text")
        .attr("class", "circle-label")
        .attr("x", 0)
        .attr("y", d => innerRadius + (radius - innerRadius) * (d / globalMaxCO2) + 15) 
        .attr("text-anchor", "middle")
        .attr("font-size", "12px") 
        .attr("fill", "black")
        .text(d => `${Math.round(d / 1_000_000_000)}B`); // Display CO2 emissions in billions

    // Define the arc generator using the globalMaxCO2 to scale the radius
    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(d => innerRadius + (radius - innerRadius) * (d.data.co2 / globalMaxCO2 || 1)); 

    const pie = d3.pie()
        .value(d => d.disasters)
        .sort(null); 

    const arcs = pie(chartData);

    svg.selectAll("path")
        .data(arcs)
        .enter().append("path")
        .attr("d", arc)
        .attr("fill", d => colorMapping[d.data.continent])
        .attr("stroke", "#fff");

    // Clear any existing year text to avoid duplicates
    svg.selectAll(".year-text").remove(); 

    // Add the year text in the center of the donut
    svg.append("text")
        .attr("class", "year-text")
        .attr("x", 0) // Center horizontally
        .attr("y", 10) // Center vertically
        .attr("text-anchor", "middle") // Center align the text
        .attr("alignment-baseline", "middle") // Middle align the text vertically
        .attr("font-size", "30px") 
        .attr("fill", "#ccccc") // Text color
        .text(selectedYear); // Display the selected year
}

// Function to create the legend
function createLegend(continentOrder, colorMapping) {
    d3.select("#legend").html(""); // Clear the previous legend

    // Add a title to the legend
    d3.select("#legend").append("div")
        .attr("id", "legend-title")
        .text("Number of disasters in the following continents:")
        .style("font-weight", "bold") 
        .style("font-size", "16px")   
        .style("margin-top", "7px")
        .style("margin-bottom", "10px"); 

    // Create a new legend for each continent
    const legend = d3.select("#legend").selectAll(".legend-item")
        .data(continentOrder)
        .enter().append("div")
        .attr("class", "legend-item")
        .style("display", "flex") 
        .style("align-items", "center") 
        .style("margin-bottom", "5px");

    // Append colored boxes and labels to the legend
    legend.append("div")
        .attr("class", "legend-color")
        .style("background-color", d => colorMapping[d])
        .style("width", "20px") 
        .style("height", "20px") 
        .style("margin-right", "10px"); 

    legend.append("span") 
        .text(d => d)
        .style("font-size", "14px"); 
}

