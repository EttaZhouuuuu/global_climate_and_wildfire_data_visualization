const margin = {top: 50, right: 100, bottom: 100, left: 50},
        width = 960 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    const svg = d3.select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let currentInterval;

    Promise.all([
        d3.csv("CO2_Temperature_data_1883_2013.csv"), 
        d3.csv("country_to_region.csv") 
    ]).then(function([co2Data, regionData]) {

        const countryToRegion = new Map(regionData.map(d => [d.Country, d.Region]));

        const filterContainer = d3.select("#filter-container");
        const countries = [...new Set(co2Data.map(d => d.Country))];
        const regions = [...new Set(regionData.map(d => d.Region))];

        countries.forEach(country => {
            filterContainer.append("label")
                .html(`<input type="checkbox" value="${country}" class="filter-checkbox"> ${country}`)
                .style("margin-right", "10px");
        });

        regions.forEach(region => {
            filterContainer.append("label")
                .html(`<input type="checkbox" value="${region}" class="filter-checkbox"> ${region}`)
                .style("margin-right", "10px");
        });
        
        const y = d3.scaleLinear()
            .domain(d3.extent(co2Data, d => +d['AverageTemperature']))
            .range([height, 0]);

        const size = d3.scaleSqrt()
            .domain(d3.extent(co2Data, d => +d['% of World'].replace('%', '')))
            .range([5, 40]); 

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const xAxisGroup = svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`);

        const yAxisGroup = svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .style("text-anchor", "middle")
            .text("CO2 Emissions (Tons)");

        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", -height / 2)
            .attr("y", -35)
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .text("Average Temperature (°C)");

        svg.append("text")
            .attr("class", "subtitle")
            .attr("x", width / 2)
            .attr("y", height + 60)
            .style("text-anchor", "middle")
            .text("CO2 emissions are dynamically scaled based on maximum emissions each year");

        svg.append("text")
            .attr("x", width + 80)
            .attr("y", height - 180)
            .style("text-anchor", "start")
            .style("font-size", "21px")
            .style("font-weight", "bold")
            .text("Bubble size:");
        
        svg.append("text")
            .attr("x", width + 90)
            .attr("y", height - 160)
            .style("text-anchor", "start")
            .style("font-size", "18px")
            .text("% World the country occupies");

        const legend = svg.append("g")
            .attr("transform", `translate(${width + 100}, 100)`)
            .attr("class", "legend");

        legend.selectAll("legend-dots")
            .data(regions)
            .enter()
            .append("circle")
            .attr("cx", 0)
            .attr("cy", (d, i) => i * 25)
            .attr("r", 7)
            .style("fill", d => color(d));

        legend.selectAll("legend-labels")
            .data(regions)
            .enter()
            .append("text")
            .attr("x", 20)
            .attr("y", (d, i) => i * 25 + 5)
            .text(d => d)
            .style("font-size", "18px");
        
        legend.append("text")
            .attr("x", -25) // Position to the left of the legend
            .attr("y", -25) // Position above the legend
            .style("font-size", "21px")
            .style("font-weight", "bold")
            .text("Continents:");

        const tooltip = d3.select("body").append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "#f4f4f4")
            .style("border", "solid 1px #d4d4d4")
            .style("padding", "5px");

        const yearText = svg.append("text")
            .attr("class", "year-text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .text("")
            .style("opacity", 0.5);

        function updateChart() {
            const selectedOptions = Array.from(d3.selectAll(".filter-checkbox:checked").nodes()).map(d => d.value);
            let filteredData = co2Data;

            if (!selectedOptions.includes("All")) {
                filteredData = co2Data.filter(d => {
                    const region = countryToRegion.get(d.Country);
                    return selectedOptions.includes(d.Country) || (region && selectedOptions.includes(region));
                });
            }

            if (currentInterval) {
                clearInterval(currentInterval);
            }

            animateChart(filteredData);
        }

        function animateChart(filteredData) {
            const years = d3.extent(filteredData, d => +d.Year);
            let currentYear = years[0];

            currentInterval = setInterval(function() {
                currentYear++;
                if (currentYear > years[1]) currentYear = years[0];

                const yearData = filteredData.filter(d => +d.Year === currentYear);
                const maxEmission = d3.max(yearData, d => +d['CO2 emission (Tons)']);

                const x = d3.scaleLinear()
                    .domain([0, maxEmission])
                    .range([0, width]);

                                const xAxis = d3.axisBottom(x)
                    .ticks(5)
                    .tickFormat(d3.format(".2s"));

                xAxisGroup.transition().call(xAxis);

                svg.selectAll(".bubble").remove();

                svg.append("g")
                    .selectAll("circle")
                    .data(yearData)
                    .join("circle")
                    .attr("class", "bubble")
                    .attr("cx", d => x(+d['CO2 emission (Tons)']))
                    .attr("cy", d => y(+d['AverageTemperature']))
                    .attr("r", d => size(+d['% of World'].replace('%', '')))
                    .style("fill", d => color(countryToRegion.get(d.Country))) 
                    .on("mouseover", function(event, d) {
                        tooltip.transition().duration(200).style("opacity", 1);
                        tooltip.html(d.Country + "<br/> CO2: " + d['CO2 emission (Tons)'] + "<br/> Temp: " + d['AverageTemperature'])
                            .style("left", (event.pageX + 5) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function() {
                        tooltip.transition().duration(500).style("opacity", 0);
                    });

                yearText.text(currentYear)
                    .transition()
                    .duration(500) 
                    .style("opacity", 0.5);

            }, 500); 
        }

        animateChart(co2Data);

        d3.selectAll(".filter-checkbox").on("change", updateChart);

        d3.select("#all-checkbox").on("change", function() {
            const checked = d3.select(this).property("checked");
            d3.selectAll(".filter-checkbox").property("checked", checked);
            updateChart();
        });

    });