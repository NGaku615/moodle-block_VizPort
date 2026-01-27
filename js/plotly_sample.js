//@vizualize
//@label Plotly.jsのサンプル
//@id aaa
(function () {
    const url_string = window.location.href;
    const url = new URL(url_string);
    const course = url.searchParams.get("id");

    const log = blockVizPortApi.fetchLogJson(3);
    console.log(log);

    const barData = [{
        x: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        y: [120, 180, 150, 200],
        type: 'bar',
        marker: { color: 'rgba(100, 149, 237, 0.8)' }
    }];

    const barLayout = {
        title: '週別アクセス数',
        yaxis: { title: '件数' },
        xaxis: { title: '週' }
    };

    Plotly.newPlot('aaa', barData, barLayout);
})();