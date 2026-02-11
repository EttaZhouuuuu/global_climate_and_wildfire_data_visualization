// Visualization 5: California Wildfire Tweet Word Cloud
// Displays frequently mentioned words in tweets about California wildfires
// Colors represent sentiment (positive, neutral, negative)
// Larger words indicate higher usage frequency
//
// Data Source: Real tweets from Kaggle Disaster Tweets Dataset
// URL: https://www.kaggle.com/datasets/vstepanchap/twitter-disaster-tweets
// Methodology: Filtered for wildfire-related tweets using keyword matching
// Sentiment Analysis: VADER (Valence Aware Dictionary and sEntiment Reasoner)

// ===== CONFIG =====
const CONFIG = {
    width: 1000,
    height: 600,
    cloudWidth: 800,
    cloudHeight: 500,
    minFontSize: 14,
    maxFontSize: 72,
    padding: 2,
    rotations: 0
};

// Sentiment colors
const COLORS = {
    positive: "#22c55e",
    neutral: "#9ca3af",
    negative: "#ef4444",
    hover: "#f97316"
};

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", function() {
    init();
});

async function init() {
    console.log("Initializing Wildfire Tweet Word Cloud...");

    try {
        await loadData();
        console.log("Data loaded successfully");
    } catch (err) {
        console.error("Error loading data:", err);
        showError("Failed to load tweet data");
    }
}

// ===== DATA LOADING =====
async function loadData() {
    try {
        const data = await d3.csv("./data/wildfire_wordcloud_data.csv");
        console.log("Raw data loaded:", data.length, "records");

        if (!data || data.length === 0) {
            console.warn("No data found, using sample data");
            loadSampleData();
            return;
        }

        // Process data
        const words = processData(data);
        console.log("Processed words:", words.length);

        if (words.length === 0) {
            loadSampleData();
            return;
        }

        createWordCloud(words);
    } catch (err) {
        console.error("Error loading CSV:", err);
        loadSampleData();
    }
}

function processData(data) {
    return data.map(d => ({
        text: d.Word || d.word || d.text,
        size: parseInt(d.Frequency || d.frequency || d.count, 10) || 1,
        sentiment: parseInt(d.Sentiment || d.sentiment, 10) || 0,
        originalSentiment: d.Sentiment || d.sentiment
    })).filter(d => d.text && d.size > 0);
}

function loadSampleData() {
    const sampleData = [
        { Word: "wildfires", Frequency: 169, Sentiment: -1 },
        { Word: "wildfire", Frequency: 52, Sentiment: -1 },
        { Word: "fire", Frequency: 46, Sentiment: -1 },
        { Word: "fires", Frequency: 28, Sentiment: -1 },
        { Word: "acres", Frequency: 21, Sentiment: -1 },
        { Word: "burning", Frequency: 12, Sentiment: -1 },
        { Word: "firefighters", Frequency: 12, Sentiment: 0 },
        { Word: "damage", Frequency: 8, Sentiment: -1 },
        { Word: "lost", Frequency: 6, Sentiment: -1 },
        { Word: "flames", Frequency: 6, Sentiment: -1 },
        { Word: "spread", Frequency: 5, Sentiment: -1 },
        { Word: "maui", Frequency: 6, Sentiment: -1 },
        { Word: "home", Frequency: 6, Sentiment: 0 },
        { Word: "spreading", Frequency: 4, Sentiment: -1 },
        { Word: "burned", Frequency: 4, Sentiment: 0 },
        { Word: "loss", Frequency: 3, Sentiment: -1 },
        { Word: "calfire", Frequency: 3, Sentiment: -1 },
        { Word: "structures", Frequency: 3, Sentiment: -1 },
        { Word: "firefighting", Frequency: 2, Sentiment: -1 },
        { Word: "homes", Frequency: 2, Sentiment: -1 },
        { Word: "evacuated", Frequency: 2, Sentiment: 0 },
        { Word: "destroying", Frequency: 2, Sentiment: -1 },
        { Word: "smoke", Frequency: 2, Sentiment: 1 },
        { Word: "blaze", Frequency: 2, Sentiment: -1 },
        { Word: "bushfire", Frequency: 1, Sentiment: 1 },
        { Word: "evacuation", Frequency: 1, Sentiment: -1 },
        { Word: "destroyed", Frequency: 1, Sentiment: -1 },
        { Word: "containment", Frequency: 1, Sentiment: -1 },
        { Word: "hotspots", Frequency: 1, Sentiment: 0 },
        { Word: "house", Frequency: 1, Sentiment: 0 }
    ];

    console.log("Using sample data:", sampleData.length, "words");
    createWordCloud(processData(sampleData));
}

// ===== WORD CLOUD CREATION =====
function createWordCloud(data) {
    const container = d3.select("#word-cloud");
    container.html("");

    console.log("Creating word cloud with", data.length, "words");

    // Calculate font size scale
    const sizeExtent = d3.extent(data, d => d.size);
    console.log("Size extent:", sizeExtent);

    const fontSizeScale = d3.scaleSqrt()
        .domain([1, sizeExtent[1]])
        .range([CONFIG.minFontSize, CONFIG.maxFontSize]);

    // Create layout
    const layout = d3.layout.cloud()
        .size([CONFIG.cloudWidth, CONFIG.cloudHeight])
        .words(data)
        .padding(CONFIG.padding)
        .rotate(CONFIG.rotations)
        .fontSize(d => fontSizeScale(d.size))
        .on("end", words => draw(words, fontSizeScale));

    layout.start();

    function draw(words, sizeScale) {
        console.log("Word layout complete:", words.length, "words positioned");

        const svg = container.append("svg")
            .attr("width", CONFIG.width)
            .attr("height", CONFIG.height + 100);

        // Title
        svg.append("text")
            .attr("x", CONFIG.cloudWidth / 2 + 100)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "20px")
            .attr("font-weight", "600")
            .attr("fill", "#1f2937")
            .text("Wildfire Tweet Word Cloud Analysis");

        // Word group
        const wordGroup = svg.append("g")
            .attr("transform", `translate(${CONFIG.cloudWidth / 2 + 100}, ${CONFIG.cloudHeight / 2 + 60})`);

        // Draw words
        const tooltip = d3.select("#tooltip");

        const texts = wordGroup.selectAll("text")
            .data(words)
            .enter()
            .append("text")
            .attr("class", "word-cloud-text")
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${d.x}, ${d.y})`)
            .attr("font-size", d => d.size + "px")
            .attr("fill", d => getSentimentColor(d.sentiment))
            .text(d => d.text)
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                // Enlarge on hover
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("font-size", d.size * 1.5 + "px")
                    .attr("fill", COLORS.hover);

                // Show tooltip
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.95);

                tooltip.html(`
                    <strong>${d.text}</strong>
                    <span class="sentiment-label">Sentiment: ${getSentimentLabel(d.sentiment)}</span>
                    <span class="frequency-label">Frequency: ${d.size.toLocaleString()}</span>
                `)
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 12) + "px");
            })
            .on("mouseout", function(event, d) {
                // Restore size
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("font-size", d.size + "px")
                    .attr("fill", getSentimentColor(d.sentiment));

                // Hide tooltip
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Add legend
        drawLegend(svg);
    }
}

function getSentimentColor(sentiment) {
    if (sentiment > 0) {
        return COLORS.positive;
    } else if (sentiment < 0) {
        return COLORS.negative;
    } else {
        return COLORS.neutral;
    }
}

function getSentimentLabel(sentiment) {
    if (sentiment > 0) {
        return "Positive";
    } else if (sentiment < 0) {
        return "Negative";
    } else {
        return "Neutral";
    }
}

function drawLegend(svg) {
    const legendData = [
        { label: "Positive", color: COLORS.positive, sentiment: 1 },
        { label: "Neutral", color: COLORS.neutral, sentiment: 0 },
        { label: "Negative", color: COLORS.negative, sentiment: -1 }
    ];

    const legendX = CONFIG.width - 140;
    const legendY = 50;

    // Legend title
    svg.append("text")
        .attr("x", legendX)
        .attr("y", legendY)
        .attr("font-size", "12px")
        .attr("font-weight", "600")
        .attr("fill", "#1f2937")
        .text("Sentiment");

    // Legend items
    const legend = svg.append("g")
        .attr("transform", `translate(${legendX}, ${legendY + 15})`);

    legendData.forEach((d, i) => {
        const item = legend.append("g")
            .attr("transform", `translate(0, ${i * 22})`);

        item.append("circle")
            .attr("r", 6)
            .attr("fill", d.color);

        item.append("text")
            .attr("x", 14)
            .attr("y", 4)
            .attr("font-size", "11px")
            .attr("fill", "#6b7280")
            .text(d.label);
    });
}

function showError(message) {
    const container = d3.select("#word-cloud");
    container.html(`
        <div style="text-align: center; padding: 60px 20px; color: #9ca3af;">
            <p style="font-size: 1rem; margin-bottom: 8px;">${message}</p>
            <p style="font-size: 0.875rem;">Please check the data file and try again.</p>
        </div>
    `);
}

