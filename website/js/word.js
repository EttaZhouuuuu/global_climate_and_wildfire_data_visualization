var width = 1000; 
var height = 600;
var wordCloudWidth = width - 200; 
var wordCloudHeight = height;

var sizeScale = d3.scaleSqrt().range([20, 120]);

var tooltip = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);

d3.csv("sentiment_analysis.csv").then(function(data) {
    console.log("Initial Data:", data);

    var words = data.map(function(d) {
        return {
            text: d.Word,
            size: +d.Frequency,
            sentiment: +d.Sentiment,
            frequency: +d.Frequency
        };
    });

    console.log("Mapped Words:", words);

    sizeScale.domain([1, d3.max(words, d => d.size)]); 

    d3.layout.cloud()
        .size([wordCloudWidth, wordCloudHeight])
        .words(words) 
        .padding(1) 
        .rotate(0)  
        .fontSize(function(d) { return sizeScale(d.size); })
        .on("end", draw)
        .start();

    function getColor(sentiment) {
        if (sentiment > 0) {
            return "green"; 
        } else if (sentiment === 0) {
            return "gray";
        } else {
            return "red"; 
        }
    }

    function draw(words) {
        console.log("Drawing Words:", words);

        var svg = d3.select("#word-cloud").append("svg")
            .attr("width", width)
            .attr("height", height + 100);  

        svg.append("text")
            .attr("x", wordCloudWidth / 2)  
            .attr("y", 20)  
            .attr("text-anchor", "middle")
            .style("font-size", "24px")
            .style("font-weight", "bold")
            .text("Harvey Disaster Tweets Word Cloud");

        var wordGroup = svg.append("g")
            .attr("transform", "translate(" + (wordCloudWidth / 2) + "," + (wordCloudHeight / 2 + 50) + ")") 
            .selectAll("text")
            .data(words) 
            .enter().append("text")
            .style("font-size", function(d) { return d.size + "px"; })
            .style("fill", function(d) { return getColor(d.sentiment); })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")";
            })
            .text(function(d) { return d.text; })
            .on("mouseover", function(event, d) {  
                console.log("Hovered Word Data:", d);
                
                d3.select(this).transition()
                    .duration(200)
                    .style("font-size", function(d) { return d.size * 1.5 + "px"; })
                    .style("fill", "orange");

                tooltip.transition()        
                    .duration(200)      
                    .style("opacity", .9);      
            })
            .on("mouseout", function(event, d) {  
                d3.select(this).transition()
                    .duration(200)
                    .style("font-size", function(d) { return d.size + "px"; })
                    .style("fill", function(d) { return getColor(d.sentiment); });

                tooltip.transition()        
                    .duration(500)      
                    .style("opacity", 0);   
            });

        var legendData = [
            { label: "Positive", color: "green" },
            { label: "Neutral", color: "gray" },
            { label: "Negative", color: "red" }
        ];

        var legendTitle = svg.append("text")
            .attr("x", wordCloudWidth - 10) 
            .attr("y", 40) 
            .style("font-size", "15px")
            .style("font-weight", "bold")
            .text("Sentiment Classification:");

        var legend = svg.append("g")
            .attr("transform", "translate(" + (wordCloudWidth + 40) + ",50)"); 

        legend.selectAll("rect")
            .data(legendData)
            .enter().append("rect")
            .attr("x", 0)
            .attr("y", function(d, i) { return i * 20; })
            .attr("width", 15)
            .attr("height", 15)
            .style("fill", function(d) { return d.color; });

        legend.selectAll("text")
            .data(legendData)
            .enter().append("text")
            .attr("x", 20)
            .attr("y", function(d, i) { return i * 20 + 12; })
            .text(function(d) { return d.label; });
    }
});
