//@vizualize
//@label d3.jsのサンプル
//@id script

(function () {
    // 文字列としてURLを取得する。
    const url_string = window.location.href;
    const url = new URL(url_string);
    const course = url.searchParams.get("id");

    console.log(url_string);
    //const target = url.searchParams.get("target") || "outputArea";

    const data = [10, 20, 30, 40, 90];
    const height = 200;
    const width = 200;

    const svg = d3.select(`#script`)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    const xScale = d3.scaleBand()
        .domain(data.map((_, i) => i))
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data)])
        .range([height, 0]);

    svg.selectAll("rect").data(data)
        .enter().append("rect")
        .attr("x", (_, i) => xScale(i))
        .attr("y", d => yScale(d))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d))
        .attr("fill", "red");
})();
