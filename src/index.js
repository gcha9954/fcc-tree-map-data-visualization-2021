import "./styles.css";
import * as d3 from "d3";
import { Library } from "@observablehq/stdlib";

document.getElementById("app").innerHTML = `
<h1 id="title">Movie Sales</h1>
<p id="description">Highest-grossing films grouped by genre</p>
`;

fetch(
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json"
)
  .then((response) => response.json())
  .then((data) => {
    const library = new Library();
    const width = 960;
    const height = 570;
    const format = d3.format(",d");
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const treemap = (data) => {
      let treemapLayout = d3.treemap().size([width, height]).padding(1)(
        d3
          .hierarchy(data)
          .sum((d) => d.value)
          .sort((a, b) => b.value - a.value)
      );
      return treemapLayout;
    };

    const root = treemap(data);

    const svg = d3
      .select("#app")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("font", "10px sans-serif");

    // Legend
    const legend = d3
      .select("#app")
      .append("svg")
      .attr("width", width)
      .attr("height", 100)
      .attr("id", "legend");

    legend
      .selectAll("rect")
      .data(d3.schemeCategory10.slice(0, 7))
      .enter()
      .append("rect")
      .attr("class", "legend-item")
      .attr("x", (d, i) => (i < 4 ? 20 + i * 150 : 20 + (i - 4) * 150))
      .attr("y", (d, i) => (i < 4 ? 10 : 40))
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", (d) => d);

    legend
      .selectAll("text")
      .data(data.children.map((item) => item.name))
      .enter()
      .append("text")
      .text((d) => d)
      .attr("x", (d, i) => (i < 4 ? 45 + i * 150 : 45 + (i - 4) * 150))
      .attr("y", (d, i) => (i < 4 ? 25 : 55));

    // Tootlip
    const tooltip = d3
      .select("#app")
      .append("div")
      .attr("id", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "1px solid black")
      .style("border-radius", "10px")
      .style("padding", "20px");

    const leaf = svg
      .selectAll("g")
      .data(root.leaves())
      .join("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
      // Event listeners for tooltip
      .on("mouseover", (e, d) => {
        tooltip.style("visibility", "visible");
      })
      .on("mousemove", (e, d) => {
        tooltip
          .style("left", `${e.pageX + 20}px`)
          .style("top", `${e.pageY - 70}px`)
          .attr("data-value", d.value)
          .html(
            `${d.data.name}<br>$${new Intl.NumberFormat("en-US").format(
              d.value
            )}`
          );
      })
      .on("mouseout", (e, d) => {
        tooltip.style("visibility", "hidden");
      });

    leaf.append("title").text(
      (d) =>
        `${d
          .ancestors()
          .reverse()
          .map((d) => d.data.name)
          .join("/")}\n${format(d.value)}`
    );

    leaf
      .append("rect")
      .attr("class", "tile")
      .attr("id", (d) => (d.leafUid = library.DOM.uid("leaf")).id)
      .attr("data-name", (d) => d.data.name)
      .attr("data-category", (d) => d.data.category)
      .attr("data-value", (d) => d.value)
      .attr("fill", (d) => {
        while (d.depth > 1) d = d.parent;
        return color(d.data.name);
      })
      .attr("fill-opacity", 0.6)
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0);

    leaf
      .append("clipPath")
      .attr("id", (d) => (d.clipUid = library.DOM.uid("clip")).id)
      .append("use")
      .attr("xlink:href", (d) => d.leafUid.href);

    leaf
      .append("text")
      .attr("clip-path", (d) => d.clipUid)
      .selectAll("tspan")
      .data((d) =>
        d.data.name.split(/(?=[A-Z][a-z])|\s+/g).concat(format(d.value))
      )
      .join("tspan")
      .attr("x", 3)
      .attr(
        "y",
        (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`
      )
      .attr("fill-opacity", (d, i, nodes) =>
        i === nodes.length - 1 ? 0.7 : null
      )
      .text((d) => d);
  });
