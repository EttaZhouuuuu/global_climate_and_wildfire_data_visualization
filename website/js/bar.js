const outerWidth = 1040;
const outerHeight = 640;
const legendSpace = 120;
const margin = { top: 20, right: 140, bottom: 45, left: 95 };
const width = outerWidth - margin.left - margin.right;
const height = outerHeight - margin.top - margin.bottom - legendSpace;

const chartSvg = d3.select("#stacked-bar-chart")
    .attr("width", outerWidth)
    .attr("height", outerHeight)
    .attr("viewBox", `0 0 ${outerWidth} ${outerHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

const svg = chartSvg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);


const x = d3.scaleBand().range([0, width]).padding(0.05);
const y = d3.scaleLinear().range([height, 0]);
const yLine = d3.scaleLinear().range([height, 0]);


// Fire/source type labels (NASA Earthdata): 0=vegetation fire, 1=volcano, 2=static land, 3=offshore
const FIRE_TYPE_LABELS = {
    "0": "Presumed vegetation fire",
    "1": "Active volcano",
    "2": "Other static land source",
    "3": "Offshore"
};
const FIRE_TYPE_KEYS = ["0", "1", "2", "3"];
const fireTypeNames = FIRE_TYPE_KEYS.map(k => FIRE_TYPE_LABELS[k]);

const color = d3.scaleOrdinal()
    .domain(fireTypeNames)
    .range(["#264653", "#2a9d8f", "#e9c46a", "#f4a261"]);


const line = d3.line()
    .x(d => x(d.Year) + x.bandwidth() / 2)
    .y(d => yLine(d.value));

// 科学计数法：如 2.0×10⁶、1.5×10⁻¹
function sciFormat(v) {
    if (v === 0 || !isFinite(v)) return "0";
    const absV = Math.abs(v);
    const exp = Math.floor(Math.log10(absV));
    const mantissa = ((v < 0 ? -1 : 1) * absV / Math.pow(10, exp)).toFixed(1);
    const sup = "⁰¹²³⁴⁵⁶⁷⁸⁹";
    const toSuper = n => String(n).split("").map(c => sup[+c]).join("");
    const expStr = exp < 0 ? "⁻" + toSuper(-exp) : toSuper(exp);
    return mantissa + "×10" + expStr;
}

(function loadData() {
    return Promise.all([
        d3.csv("../data/preprocessed/wildfire_count_by_year_type.csv"),
            d3.csv("../data/preprocessed/global_co2_by_year.csv"),
            d3.csv("../data/preprocessed/global_precip_by_year.csv"),
            d3.csv("../data/preprocessed/global_tem_by_year.csv")
    ]);
})().then(function([wildfireData, co2Data, precipData, temData]) {
    wildfireData = wildfireData.map(d => ({
        year: String(d.year ?? d.YEAR ?? ""),
        type: String(d.type ?? d.TYPE ?? ""),
        count: +(d.count ?? d.COUNT ?? 0)
    })).filter(d => d.year);

    co2Data = co2Data.map(d => ({
        year: String(d.year ?? d.YEAR ?? ""),
        global_total_co2: +(d.global_total_co2 ?? d.GLOBAL_TOTAL_CO2 ?? 0)
    })).filter(d => d.year);

    precipData = precipData.map(d => ({
        YEAR: String(d.YEAR ?? d.year ?? ""),
        ANN: +(d.ANN ?? d.ann ?? 0)
    })).filter(d => d.YEAR);

    temData = temData.map(d => ({
        YEAR: String(d.YEAR ?? d.year ?? ""),
        ANN: +(d.ANN ?? d.ann ?? 0)
    })).filter(d => d.YEAR);

    const years = [...new Set(wildfireData.map(d => d.year))].sort((a, b) => +a - +b);
    const aggregatedData = years.map(year => {
        const row = { Year: year };
        fireTypeNames.forEach(name => row[name] = 0);
        wildfireData.filter(d => d.year === year).forEach(d => {
            const label = FIRE_TYPE_LABELS[d.type];
            if (label) row[label] += +d.count;
        });
        return row;
    });

    const stackedData = d3.stack()
        .keys(fireTypeNames)
        (aggregatedData);

    x.domain(aggregatedData.map(d => d.Year));
    const barMax = d3.max(stackedData, layer => d3.max(layer, d => d[1]));
    y.domain([0, barMax * 1.5]);


    const barYears = new Set(aggregatedData.map(d => d.Year));
    const maxBarYear = d3.max([...barYears], d => +d);

    function buildLineData(metricKey) {
        if (metricKey === "co2") {
            const raw = co2Data.filter(d => barYears.has(d.year)).map(d => ({ Year: d.year, value: +d.global_total_co2 }));
            return {
                lineData: raw,
                minValue: 0,
                maxValue: d3.max(raw, d => d.value),
                yAxisLabel: "Global total CO2 (million tonnes C)",
                metricName: "CO2",
                maxYear: d3.max(raw, d => +d.Year)
            };
        }
        if (metricKey === "precip") {
            const raw = precipData.filter(d => barYears.has(d.YEAR)).map(d => ({ Year: d.YEAR, value: +d.ANN }));
            return {
                lineData: raw,
                minValue: 0,
                maxValue: d3.max(raw, d => d.value),
                yAxisLabel: "Global precipitation (annual mean, mm)",
                metricName: "Precipitation",
                maxYear: d3.max(raw, d => +d.Year)
            };
        }
        if (metricKey === "tem") {
            const raw = temData.filter(d => barYears.has(d.YEAR)).map(d => ({ Year: d.YEAR, value: +d.ANN }));
            return {
                lineData: raw,
                minValue: d3.min(raw, d => d.value) - 1,
                maxValue: d3.max(raw, d => d.value) + 1,
                yAxisLabel: "Global annual mean temperature (°C)",
                metricName: "Temperature",
                maxYear: d3.max(raw, d => +d.Year)
            };
        }
        return { lineData: [], minValue: 0, maxValue: 1, yAxisLabel: "", metricName: "", maxYear: null };
    }

    let lineData;
    const co2Built = buildLineData("co2");
    lineData = co2Built.lineData;
    yLine.domain([co2Built.minValue, co2Built.maxValue]);
    

    const horizontalGridLines = svg.append("g")
        .attr("class", "grid");

    const yTicks = y.ticks(6);

    horizontalGridLines.selectAll(".grid-line")
        .data(yTicks.slice(0, yTicks.length))
        .enter().append("line")
        .attr("class", "grid-line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d))
        .attr("stroke", "#adadad")
        .attr("stroke-width", 1);

    svg.selectAll(".layer")
        .data(stackedData)
        .enter().append("g")
        .attr("class", "layer")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => x(d.data.Year))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth());

    svg.append("path")
        .datum(lineData)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("d", line);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y).ticks(6).tickFormat(sciFormat));

    const rightAxis = svg.append("g")
        .attr("transform", `translate(${width}, 0)`)
        .call(d3.axisRight(yLine).ticks(6).tickFormat(sciFormat));

    svg.append("text")
        .attr("transform", `translate(${width / 2}, ${height + margin.bottom})`)
        .style("text-anchor", "middle")
        .text("Year");

    svg.append("text")
        .attr("transform", "rotate(-90)") 
        .attr("y", 0 - margin.left + 10) 
        .attr("x", 0 - height / 2) 
        .attr("text-anchor", "middle")
        .text("Number of detections");


    const rightYAxisLabel = svg.append("text")
        .attr("transform", `translate(${width + 85}, ${height / 2}) rotate(-90)`) 
        .attr("text-anchor", "middle")
        .text("Global total CO2 (million tonnes C)");

    const availabilityNote = svg.append("text")
        .attr("x", width)
        .attr("y", -6)
        .attr("text-anchor", "end")
        .style("font-size", "12px")
        .style("fill", "#666");

    function updateAvailabilityNote(built) {
        if (!Number.isFinite(built.maxYear) || built.maxYear >= maxBarYear) {
            availabilityNote.text("");
            return;
        }
        availabilityNote.text(`${built.metricName} data available through ${built.maxYear}; ${maxBarYear} unavailable.`);
    }

    updateAvailabilityNote(co2Built);

    d3.select("#co2-button").on("click", function() {
        updateLine("co2");
    });

    d3.select("#precipitation-button").on("click", function() {
        updateLine("precip");
    });

    d3.select("#temperature-button").on("click", function() {
        updateLine("tem");
    });


    function updateLine(metricKey) {
        const built = buildLineData(metricKey);
        lineData = built.lineData;
        yLine.domain([built.minValue, built.maxValue]);

        svg.select(".line")
            .datum(lineData)
            .transition()
            .duration(1000)
            .attr("d", line);

        rightAxis.transition()
            .duration(1000)
            .call(d3.axisRight(yLine).ticks(6).tickFormat(sciFormat));

        rightYAxisLabel.transition()
            .duration(1000)
            .text(built.yAxisLabel)
            .attr("transform", `translate(${width + 85}, ${height / 2}) rotate(-90)`);

        updateAvailabilityNote(built);
    }

    const legend = svg.append("g")
        .attr("transform", `translate(0, ${height + margin.bottom + 48})`);


    legend.append("text")
        .attr("x", 0) 
        .attr("y", 0) 
        .style("font-size", "15px")
        .style("font-weight", "bold")
        .text("Fire / source type");

    const markerSize = 18;
    const markerTextGap = 8;
    const legendItemGap = 28;
    const legendRowGap = 28;
    const legendStartY = 18;

    const measuredLegendItems = fireTypeNames.map(typeName => {
        const probe = legend.append("text")
            .style("font-size", "12px")
            .style("visibility", "hidden")
            .text(typeName);
        const textWidth = probe.node().getBBox().width;
        probe.remove();
        return { typeName, itemWidth: markerSize + markerTextGap + textWidth };
    });

    let legendX = 0;
    let legendY = legendStartY;
    measuredLegendItems.forEach(({ typeName, itemWidth }) => {
        if (legendX > 0 && legendX + itemWidth > width) {
            legendX = 0;
            legendY += legendRowGap;
        }
        const legendRow = legend.append("g")
            .attr("transform", `translate(${legendX}, ${legendY})`);

        legendRow.append("rect")
            .attr("width", markerSize)
            .attr("height", markerSize)
            .attr("fill", color(typeName));

        legendRow.append("text")
            .attr("x", markerSize + markerTextGap)
            .attr("y", 13)
            .style("font-size", "12px")
            .text(typeName);

        legendX += itemWidth + legendItemGap;
    });
}).catch(function(err) {
    console.error("Failed to load data:", err);
    alert("图表无法加载数据。请勿直接双击打开 HTML，改用本地服务器打开：\n\n在终端进入项目根目录，运行\n  python -m http.server 8080\n然后浏览器访问 http://localhost:8080/website/vis1.html");
});
