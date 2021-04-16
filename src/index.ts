import * as d3 from "d3";
import * as topojson from "topojson-client";
const spainjson = require("./spain.json");
const d3Composite = require("d3-composite-projections");
import { latLongCommunities } from "./communities";
import { 
  stats,
  newStats,
  ResultEntry
   } from "./stats";


  const maxAffected= stats.reduce(
    (max, item) => (item.value > max ? item.value : max),
    0
  );


const affectedRadiusScale =  d3
  .scaleThreshold<number,number>()
  .domain([0,10,100,1000,5000,10000,15000])
  .range([0,5,10,15,20,35,40]);

const calculateRadiusBasedOnAffectedCases = (data :ResultEntry[],comunidad: string) => {
  const entry =  data.find((item) => item.name === comunidad);
   
  return entry ? affectedRadiusScale(entry.value) : 0;
};

const color = d3
  .scaleThreshold<number, string>()
  .domain([0,10,20,100,1000,2000,5000,10000,15000])
  .range([
  "#D1EAEF",
  "#00B4BA",
  "#008EB4",
  "#0066A5",
  "#003E89",
  "#09115E",
  "#10153E"
]);

const assigncommunityBackgroundColor = (data :ResultEntry[],comunidad: string) => {
    const item = data.find(
      item => item.name === comunidad
    );
    return item ? color(item.value) : color(0);
};


const svg = d3
  .select("body")
  .append("svg")
  .attr("width", 1024)
  .attr("height", 800)
  .attr("style", "background-color: #FBFAF0");

const aProjection = d3Composite
  .geoConicConformalSpain() // Let's make the map bigger to fit in our resolution
  .scale(3300)
  // Let's center the map
  .translate([500, 400]);

const geoPath = d3.geoPath().projection(aProjection);
const geojson = topojson.feature(spainjson, spainjson.objects.ESP_adm1);

svg
  .selectAll("path")
  .data(geojson["features"])
  .enter()
  .append("path")
  .attr("class", "country")
  .style("fill", function(d: any) {
        return assigncommunityBackgroundColor(stats,d.properties.NAME_1);
      })
  // data loaded from json file
  .attr("d", geoPath as any);

 svg
  .selectAll("circle")
  .data(latLongCommunities)
  .enter()
  .append("circle")
  .attr("class", "affected-marker")
  .attr("r", (d) => calculateRadiusBasedOnAffectedCases(stats,d.name))
  .attr("cx", (d) => aProjection([d.long, d.lat])[0])
  .attr("cy", (d) => aProjection([d.long, d.lat])[1]);
 


  const updateMap = (data: ResultEntry[]) => {

    d3
    .selectAll("path")
    .data(geojson["features"])
    .attr("class", "country")
    .transition()
    .duration(1500)
    .style("fill", function(d: any) {
        return assigncommunityBackgroundColor(data,d.properties.NAME_1);
      })
     // data loaded from json file
    .attr("d", geoPath as any);
    
    d3 .selectAll("circle")
    .data(latLongCommunities)
    .attr("class", "affected-marker")
    .attr("r", (d) => calculateRadiusBasedOnAffectedCases(data,d.name))
    .transition()
    .duration(2500)
    .attr("cx", (d) => aProjection([d.long, d.lat])[0])
    .attr("cy", (d) => aProjection([d.long, d.lat])[1]);

    
  };


  document
    .getElementById("OLD")
    .addEventListener("click", function handleOldResults() {
    updateMap(stats);
  });

document
    .getElementById("NEW")
    .addEventListener("click", function handleNewResults() {
    updateMap(newStats);
  });
