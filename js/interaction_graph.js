// Define Default constants
dflt_config = {
  width               : 900,
  height              : 450,
  padding             : 0,
  colorScaleDomain    : ["Opposé","Favorable","Utilise des hashtags pour et contre les initiatives","Ne tweete pas avec ces hashtags"],
  colorScaleRange     : ['#d64541','#87d37c','#CD853F', '#bfbfbf'],
  borderColor         : ["white", "#34495e"],//"#e4e9ed", "#34495e"
};

function drawGraph(id, config){
  if (!id) throw 'Please define an id for the svg';

    // Define default or provided config
  if (!config){
    config = {}
  }
  const width             = isNaN(config.width) ? dflt_config.width : config.width;
  const height            = isNaN(config.height) ? dflt_config.height : config.height;
  const padding           = isNaN(config.padding) ? dflt_config.padding : config.padding;
  const colorScaleDomain  = !config.colorScaleDomain ? dflt_config.colorScaleDomain : config.colorScaleDomain;
  const colorScaleRange   = !config.colorScaleRange ? dflt_config.colorScaleRange : config.colorScaleRange;
  const borderColor       = !config.borderColor ? dflt_config.borderColor : config.borderColor;

  const svg = d3.select("#" + id)
            .append('svg')
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 " + width + " " + height);

  // create a tooltip
  const tooltip = d3.select("body")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip");

  d3.json("data/pesticides_graph_with_.json", function(error, graph) {
    if (error) throw error;

    // Node size scale
    const minValue = d3.min(graph.nodes, function(d) { return +d.nb_tweets; });
    const maxValue = d3.max(graph.nodes, function(d) { return +d.nb_tweets; });
    console.log(minValue, maxValue)
    const size = d3.scaleSqrt()
        .domain([minValue,maxValue])
        .range([2, 40]);

    // Node color scale
    const color = d3.scaleOrdinal()
      .domain(colorScaleDomain)
      .range(colorScaleRange);

    var simulation = d3.forceSimulation()
      .force("boundary", forceBoundary(30,30,width-30, height-30))
      .force("link", d3.forceLink().id(function(d) { return d.id; }))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force('charge', d3.forceManyBody().strength(-50))
      .force('collide',d3.forceCollide().radius(function(d) { return  6 + size(d.nb_tweets); }).iterations(2));

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
          .attr("stroke-width", function(d) { return 0.2*d.weight; })
          .attr("stroke", "grey")

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(graph.nodes)
        .enter().append("g");
      
    var circles = node.append("circle")
        .attr("r", function(d) { return  size(d.nb_tweets); })
        .attr("fill", function(d) { return color(d.nonouiaucun); })
        .attr("stroke", function(d) {return borderColor[0]; })
        .attr("stroke-opacity", 1)
        .attr("stroke-width", function(d) {return 0.1*size(size(d.nb_tweets));})
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("mouseover", function(d){
          var textToDisplay = "<b>" + d.name + "</b><br>" 
                    + "Nombre de tweets: <b>" + d.nb_tweets + "</b>.<br>"
                    + "Nombre de Followers: <b>" + d.followers + "</b>.<br>"
                    + "Nombre d'intéractions: <b>" + d.interaction + "</b>.<br>"
                    ;

          // Compute bounded coordinates
          const tooltipWidth = tooltip.node().getBoundingClientRect().width 
          const tooltipHeight =  tooltip.node().getBoundingClientRect().height 
          const mapWidth = svg.node().getBoundingClientRect().width 
          const mapHeight = svg.node().getBoundingClientRect().height 
          var left = Math.max(0, Math.min(mapWidth - tooltipWidth, d3.event.pageX - d3.select('.tooltip').node().offsetWidth - 5));
          var top = Math.max(0, Math.min(mapHeight - tooltipHeight, d3.event.pageY - d3.select('.tooltip').node().offsetHeight));

          tooltip
            .html(textToDisplay)
            .style("left", left + "px")
            .style("top", top + "px");


          tooltip.style("opacity", 1);
          d3.select(this).style("stroke", color(d.nonouiaucun));
          d3.select(this).style("fill", 'white');//brighter(1)d3.rgb(color(d.nonouiaucun)).darker(1)

        })
        .on("mousemove", function(d){

          
        })
        .on("mouseleave", function(d){
          tooltip.style("opacity", 0);
          d3.select(this).style("fill", color(d.nonouiaucun));
          d3.select(this).style("stroke", borderColor[0]);
            
        });

    // Add text to big nodes
    node
      .filter(function(d) { return d.nb_tweets > 15 })
      .append("text")
          .text(function(d){return d.name})
          .style("text-anchor", "middle")
          .style("font-weight", "bold")
          .style("font-size", function(d) { return Math.max(3 * size(d.nb_tweets)/ d.name.length, 5) })
          .style("fill", "white");

  /* 13 letters 40 8pt 
    var labels = node.append("text")
        .text(function(d) {
          return d.name;
        })
        .attr('x', 6)
        .attr('y', 3);
  

    node.append("title")
        .text(function(d) { return d.name; });
  */
    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    function ticked() {

      node
          .attr("transform", function(d) {
            radius = 3 + Math.sqrt(d.nb_tweets)*2;
            return "translate(" + d.x + "," + d.y + ")";
          })

      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
    }

    // Add Legend color
    svg.append("g")
      .attr("class", "legend")
      .style("font-size", "0.5rem")
      .style("padding", "5px")
      .attr("transform", "translate(20,20)");

    var colorLegend = d3.legendColor()
      .labelFormat(d3.format(".0f"))
      .shape("path", d3.symbol().type(d3.symbolCircle).size(150)())
      .title("Hashtags utilisés ou retweetés")
      .labelWrap(80)
      .titleWidth(100)
      .orient("vertical")
      .scale(color)
      .shapePadding(5)
      .labelOffset(10);

    svg.select(".legend")
      .call(colorLegend);


    // Add legend size
    var valuesToShow = [1, 10, 50]
    var xCircle = 50
    var xLabel = 100
    var yCircle = height

    svg
      .append("text")
      .attr("x", xCircle-35)
      .attr("y", height-85)
      .attr("dy", "0em")
      .style("font-size", "0.5rem")
      .text("Nombre de tweets postés,");
    svg
      .append("text")
      .attr("x", xCircle-35)
      .attr("y", height-85)
      .attr("dy", "1em")
      .style("font-size", "0.5rem")
      .text("répondus ou retweetés");

    svg
      .selectAll("legend_size")
      .data(valuesToShow)
      .enter()
      .append("circle")
        .attr("cx", xCircle)
        .attr("cy", function(d){ return yCircle - size(d) } )
        .attr("r", function(d){ return size(d) })
        .style("fill", "none")
        .attr("stroke", "black")

    // Add legend: segments
    svg
      .selectAll("legend_size")
      .data(valuesToShow)
      .enter()
      .append("line")
        .attr('x1', function(d){ return xCircle + size(d) } )
        .attr('x2', xLabel)
        .attr('y1', function(d){ return yCircle - size(d) } )
        .attr('y2', function(d){ return yCircle - size(d) } )
        .attr('stroke', 'black')
        .style('stroke-dasharray', ('2,2'))

    // Add legend: labels
    svg
      .selectAll("legend_size")
      .data(valuesToShow)
      .enter()
      .append("text")
        .attr('x', xLabel)
        .attr('y', function(d){ return yCircle - size(d) } )
        .text( function(d){ return d } )
        .style("font-size", 10)
        .attr('alignment-baseline', 'middle')

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  });

}

drawGraph("graph");
