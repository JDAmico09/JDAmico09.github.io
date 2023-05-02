/**
* Creates random points in a given rectangle.
*
* @param {*} start The beginning of one side of your rectangle.
* @param {*} end The end of the same side of your rectangle.
* @param {*} start2 The beginning of the adjacent side of your rectangle.
* @param {*} end2 The end of the adjacent side of your rectangle.
* @param {*} pValue A percentage to determine how likely the point should exist.
* @returns An array of random points within your given rectangle.
*/
function squigglyPointGenerator(start, end, start2, end2, pValue) {
    squigglyPoints = [];
   
   
    for (let sX = start; sX < end; sX++) {
      for (let sY = start2; sY < end2; sY++) {
        if (Math.random() < pValue) {
          squigglyPoints.push(
            (obj = {
              x: sX.toString(),
              y: sY.toString(),
            })
          );
        }
      }
    }
   
   
    return squigglyPoints;
   }
   
   
   /**
   * Creates the scales to make a voronoi diagram.
   * It creates a scale for the x-axis and the y-axis.
   * Additionally, it creates a scale to create voronoi lines from a list of points.
   * @param {*} dataBounds The minimum and maximum x and y values of the points you are creating a voronoi from.
   * @param {*} HEIGHT The height of the svg.
   * @param {*} WIDTH The width of the svg.
   * @returns All of the scales in a dictionary.
   */
   function createScales(dataBounds, HEIGHT, WIDTH) {
    var xScale = d3
      .scaleLinear()
      .domain([dataBounds["minXVal"], dataBounds["maxXVal"]])
      .range([WIDTH / 4, (3 * WIDTH) / 4]);
   
   
    var yScale = d3
      .scaleLinear()
      .domain([dataBounds["minYVal"], dataBounds["maxYVal"]])
      .range([(3 * HEIGHT) / 4, HEIGHT / 4]);
   
   
    var voronoiScale = d3
      .voronoi()
      .x((d) => d.x)
      .y((d) => d.y)
      .extent([
        [0, 0],
        [WIDTH, HEIGHT],
      ]);
   
   
    return { xScale: xScale, yScale: yScale, voronoiScale: voronoiScale };
   }
   
   
   /**
   * Creates points on an svg.
   *
   * @param {*} data A list of the x and y values to draw.
   * @param {*} svg The svg to draw on.
   * @param {*} color The color of the points.
   * @param {*} className The class name of the points.
   */
   function drawPoints(data, svg, color, className) {
    // Plot the data points (black)
    svg
      .append("g")
      .attr("class", className)
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 2)
      .style("fill", color);
   }

   var squigglesHidden = false;
   function toggleSquigglyPoints(){
    window.event.preventDefault();
    svg = d3.select("svg");
    svg
      .selectAll(".squigglyPoints")
      .style("fill-opacity", (d)=>{
        if(squigglesHidden){
            squigglesHidden=false;
            return 100;
        }
        else{
            squigglesHidden=true;
            return 0;
        }
      });
   }
   
   
   /**
   * Creates random points around a voronoi diagram to make the external lines squiggly.
   *
   * @param {*} HEIGHT The height of the svg.
   * @param {*} WIDTH The width of the svg.
   * @param {*} x The scale of the x-axis.
   * @param {*} y The scale of the y-axis.
   * @param {*} dataBounds The minimum and maximum x and y values of the points you are creating a voronoi from.
   * @returns A list of the random points around the voronoi diagram.
   */
   function createSquigglyPoints(HEIGHT, WIDTH, x, y, dataBounds) {
    const K_DISTANCE_RATIO = 0.7 / 0.15;
    const KW_DISTANCE =
      (dataBounds["maxXVal"] - dataBounds["minXVal"]) / K_DISTANCE_RATIO;
    const KH_DISTANCE =
      (dataBounds["maxYVal"] - dataBounds["minYVal"]) / K_DISTANCE_RATIO;
    const P_VALUE = 0.01;
    const POINTS_RADIUS = 2;
   
   
    let squigglyPointsLeft = squigglyPointGenerator(
      POINTS_RADIUS,
      x(dataBounds["minXVal"] - KW_DISTANCE),
      POINTS_RADIUS,
      HEIGHT,
      P_VALUE
    );
   
   
    let squigglyPointsRight = squigglyPointGenerator(
      x(dataBounds["maxXVal"] + KW_DISTANCE),
      WIDTH,
      POINTS_RADIUS,
      HEIGHT,
      P_VALUE
    );
   
   
    let squigglyPointsBottom = squigglyPointGenerator(
      POINTS_RADIUS,
      WIDTH,
      POINTS_RADIUS,
      y(dataBounds["maxYVal"] + KH_DISTANCE),
      P_VALUE
    );
   
   
    let squigglyPointsTop = squigglyPointGenerator(
      POINTS_RADIUS,
      WIDTH,
      y(dataBounds["minYVal"] - KH_DISTANCE),
      HEIGHT,
      P_VALUE
    );
   
   
    var squigglyPoints = [
      ...squigglyPointsLeft,
      ...squigglyPointsRight,
      ...squigglyPointsTop,
      ...squigglyPointsBottom,
    ];
   
   
    return squigglyPoints;
   }
   
   
   /**
   * Finds values that are not undefined.
   * @returns True for defined values
   */
   function isNotUndefined(d) {
    if (typeof d == "undefined") {
      return false;
    }
    return true;
   }
   
   
   /**
   * Draws the lines of a voronoi diagram for a set of points.
   *
   * @param {*} data The points to create a voronoi diagram of.
   * @param {*} squigglyPoints Random points around a voronoi diagram to make the external lines squiggly.
   * @param {*} voronoi The scale to create a voronoi diagram from points.
   * @param {*} svg The svg to draw the voronoi diagram on.
   */
   function drawVoronoiLines(data, squigglyPoints, voronoi, svg) {
    const ORIGINAL_POINTS_LENGTH = data.length;
   
   
    data = d3.merge([data, squigglyPoints]); //combine original data and random points to re-compute voronoi
    let voronoiPolygons = voronoi(data).polygons().filter(isNotUndefined);
    originalVoronoiPolygons = voronoiPolygons.slice(0, ORIGINAL_POINTS_LENGTH);
    let count = -1;
   
    svg
      .append("g")
      .attr("class", "voronoiLines")
      .selectAll("path")
      .data(originalVoronoiPolygons)
      .enter()
      .append("path") // Add a <path> element for each polygon
      .attr("d", (d) => {
        return "M" + d.join("L") + "Z"; // Generate a path string for the current polygon
      })
      .attr("fill", (d) => {
        count++;
        if(count%5==0){
            return "#1b9e77";
        }
        else if(count%4==0){
            return "#d95f02";
        }
        else if(count%3==0){
            return "#7570b3";
        }
        else if(count%2==0){
            return "#e7298a";
        }
        else{
            return "#66a61e";
        }
      })
      .attr("fill-opacity", 100)
      .attr("stroke", "black")
      .attr("stroke-opacity", 100);
   }
   
   
   /**
   * The minimum and maximum x and y values of an array of points.
   * @param {*} data An array of points.
   * @returns The minimum X, the minimum Y, the maximum X, and the maximum Y.
   */
   function retrieveDataBounds(data) {
    const xValues = data.map((d) => parseInt(d.x));
    const yValues = data.map((d) => parseInt(d.y));
   
   
    let dataBounds = {
      minXVal: d3.min(xValues),
      minYVal: d3.min(yValues),
      maxXVal: d3.max(xValues),
      maxYVal: d3.max(yValues),
    };
   
   
    return dataBounds;
   }
   
   
   function relayChartInformation() {
    window.event.preventDefault();
    const voronoiForm = document.getElementById("voronoiDataForm");
    const voronoiFormJS = new FormData(voronoiForm);
    var voronoiPoints = voronoiFormJS.get("voronoiPoints");
    voronoiPoints = d3.csvParse(voronoiPoints);
    //console.log(voronoiPoints);
   
    createVoronoi(voronoiPoints);
   
    function createVoronoi(data) {
      const HEIGHT = 500;
      const WIDTH = 500;
      squigglesHidden=false;
   
   
      d3.select("svg").selectAll("g").remove();
   
   
      var svg = d3 // Create the main svg element
        .select("svg")
        .attr("height", HEIGHT)
        .attr("width", WIDTH)
        .append("g");
   
   
      var dataBounds = retrieveDataBounds(data);
   
   
      var {
        xScale: x,
        yScale: y,
        voronoiScale: voronoi,
      } = createScales(dataBounds, HEIGHT, WIDTH); // Create scales
   
   
      var squigglyPoints = createSquigglyPoints(
        // Create points to make external map lines squiggly
        HEIGHT,
        WIDTH,
        x,
        y,
        dataBounds
      );
   
   
      data.forEach((d) => {
        //scale data points
        d.x = x(d.x);
        d.y = y(d.y);
      });
   
   
      drawVoronoiLines(data, squigglyPoints, voronoi, svg);
      drawPoints(data.slice(0, data.length), svg, "black", "mainVoronoiPoints");
      drawPoints(squigglyPoints, svg, "red", "squigglyPoints");
    }
   }

   function presetData1(){
    document.getElementById("voronoiPoints").value = 
`x,y
4,4
4,7
4,10
4,13
4,16
6,5
6,8
6,11
6,14
8,6
8,9
8,12
8,15
10,5
10,8
10,11
10,14
12,6
12,9
12,12
12,15
14,5
14,8
14,11
14,14`;
   }

   function presetData2(){
    document.getElementById("voronoiPoints").value = 
`x,y
0,2
0,7
0,9
0,10
1,6
1,7
2,3
2,5
2,7
2,14
3,6
3,12
4,6
4,10
4,14
5,6
5,7
5,12
6,9
7,10
8,11
9,11
10,13
11,13
13,14`;
   }

   function presetData3(){
    document.getElementById("voronoiPoints").value = 
`x,y
0,3
0,6
0,11
0,16
0,18
0,19
1,5
1,6
1,8
1,10
1,11
1,12
1,13
1,16
2,4
2,10
2,11
2,13
2,15
2,16
2,17
2,18
3,4
3,5
3,6
3,7
3,8
3,11
3,13
3,14
3,17
3,18
3,19
4,5
4,9
4,13
4,15
4,17
4,19
5,6
5,7
5,8
5,9
5,10
5,13
5,14
6,7
6,9
6,11
6,17
6,18
7,8
7,9
7,10
7,12
7,14
7,16
7,18
7,19
8,10
8,11
8,12
8,13
8,15
8,16
8,18
8,19
9,10
9,11
9,15
9,16
9,18
9,19
10,12
10,13
10,14
10,15
10,19
11,12
11,13
11,14
11,15
11,16
11,17
11,18
11,19
12,13
12,16
12,18
13,16
14,16
14,19
15,17
16,17`;
   }

   function presetData4(){
    document.getElementById("voronoiPoints").value = 
`x,y
0,2
0,5
0,6
0,7
0,11
0,13
0,16
0,17
1,0
1,3
1,4
1,5
1,6
1,7
1,8
1,9
1,10
1,15
1,16
1,17
1,19
2,3
2,4
2,5
2,7
2,8
2,10
2,11
2,13
2,14
2,16
2,18
3,0
3,3
3,5
3,8
3,10
3,12
3,13
3,14
3,15
3,16
3,17
3,18
4,0
4,1
4,2
4,3
4,4
4,6
4,7
4,10
4,16
4,18
5,1
5,2
5,5
5,14
5,15
5,16
5,17
5,18
5,19
6,0
6,3
6,4
6,9
6,12
6,13
6,14
6,15
6,16
6,17
6,18
6,19
7,0
7,1
7,2
7,4
7,7
7,8
7,10
7,11
7,15
7,16
7,19
8,0
8,1
8,5
8,6
8,7
8,10
8,14
8,16
8,19
9,5
9,6
9,7
9,12
9,13
9,16
9,18
9,19
10,5
10,8
10,9
10,14
10,15
10,16
10,17
10,18
11,0
11,1
11,4
11,5
11,6
11,8
11,11
11,12
11,17
12,0
12,2
12,3
12,6
12,7
12,10
12,15
12,16
12,18
13,2
13,7
13,8
13,12
13,13
13,14
13,16
13,17
14,0
14,2
14,5
14,6
14,7
14,10
14,13
14,14
14,16
14,17
15,0
15,2
15,3
15,11
15,13
15,14
15,16
15,18
15,19
16,0
16,2
16,8
16,10
16,12
16,14
16,15
16,16
16,17
16,18
17,4
17,5
17,6
17,10
17,13
17,14
17,15
17,16
17,17
17,19
18,2
18,6
18,8
18,9
18,12
18,13
18,15
18,17
18,18`;
   }
   
   
   const voronoiDataForm = document.getElementById("voronoiDataForm");
   voronoiDataForm.onsubmit = relayChartInformation;
   