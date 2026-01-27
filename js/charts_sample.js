//@vizualize
//@label charts.jsのサンプル
// @id charts_sample

(function () {
    // div に canvas を追加
    const container = document.getElementById('charts_sample');
    const canvas = document.createElement('canvas');
    canvas.id = 'myChart';
    container.appendChild(canvas);

    // Chart.js によるグラフ描画
    const ctx = document.getElementById('myChart').getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['月', '火', '水', '木', '金'],
            datasets: [{
                label: 'アクセス数',
                data: [12, 19, 3, 5, 2],
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
})();