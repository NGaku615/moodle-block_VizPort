//@vizualize
//@label 課題提出割合
// @id circle_percentage

(function () {
    // マウント先
    const mountId = "circle_percentage";
    let mount = d3.select(`#${mountId}`);
    if (mount.empty()) mount = d3.select("body").append("div").attr("id", mountId);
    mount.html(""); // クリア

    // Chart.js ローダー
    function loadChartJs() {
        if (window.Chart) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "https://cdn.jsdelivr.net/npm/chart.js";
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("Chart.jsの読み込みに失敗"));
            document.head.appendChild(s);
        });
    }

    // データ取得
    Promise.all([
        blockVizPortApi.fetchLogJson(6), // 受講者一覧（配列想定）
        blockVizPortApi.fetchLogJson(8)  // 課題ごとのsubmitted_user_count配列
    ])
        .then(async ([students, students_submit]) => {
            await loadChartJs();

            // 受講者数
            const enrolled = Array.isArray(students)
                ? students.length
                : (Number(students?.total) || Number(students?.count) || 0);

            if (!enrolled) {
                mount.append("div")
                    .style("color", "#b91c1c")
                    .style("margin", "8px 0")
                    .text("受講者数が取得できませんでした（select=6のレスポンスを確認してください）。");
            }

            // 課題データの正規化
            const items = Array.isArray(students_submit) ? students_submit : [];
            if (!items.length) {
                mount.append("div").text("課題データが見つかりませんでした（select=8のレスポンスを確認してください）。");
                return;
            }

            const parsed = items.map(d => {
                const submitted = Math.max(0, Number(d.submitted_user_count ?? d.submitted ?? 0));
                const notSubmitted = Math.max(0, enrolled - submitted);
                const name = d.assignname ?? d.name ?? `課題 ${d.assignid ?? ""}`.trim();
                const pct = enrolled ? (submitted / enrolled) * 100 : 0;
                return { name, submitted, notSubmitted, pct };
            });

            // 課題ごとにカード + キャンバスを作成して描画
            parsed.forEach(item => {
                const card = mount.append("div")
                    .style("display", "inline-block")
                    .style("vertical-align", "top")
                    .style("margin", "12px")
                    .style("padding", "12px")
                    .style("border", "1px solid #e5e7eb")
                    .style("border-radius", "12px")
                    .style("box-shadow", "0 1px 3px rgba(0,0,0,0.06)")
                    .style("width", "280px")
                    .style("background", "#fff");

                card.append("div")
                    .style("font-weight", "600")
                    .style("margin-bottom", "8px")
                    .text(item.name);

                const canvas = card.append("canvas").node();

                // Chart.js
                new Chart(canvas.getContext("2d"), {
                    type: "pie",
                    data: {
                        labels: ["提出済み", "未提出"],
                        datasets: [{
                            data: [item.submitted, item.notSubmitted],
                            // 色は必要なら調整してください
                            backgroundColor: ["#60a5fa", "#c7d2fe"],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: "bottom" },
                            title: {
                                display: true,
                                text: `提出率 ${item.pct.toFixed(1)}%（${item.submitted}/${enrolled}）`
                            },
                            tooltip: {
                                callbacks: {
                                    label: (ctx) => {
                                        const total = item.submitted + item.notSubmitted;
                                        const val = ctx.parsed;
                                        const pct = total ? (val / total) * 100 : 0;
                                        return `${ctx.label}: ${val}人 (${pct.toFixed(1)}%)`;
                                    }
                                }
                            }
                        }
                    }
                });

                // 補足情報
                card.append("div")
                    .style("margin-top", "8px")
                    .style("font-size", "12px")
                    .style("color", "#374151")
                    .html(`提出済み <b>${item.submitted}</b> / 登録者 <b>${enrolled}</b>（未提出: ${item.notSubmitted}）`);
            });
        })
        .catch(error => {
            console.error("データ取得エラー:", error);
            d3.select(`#${mountId}`).append("div").text("データの取得または描画に失敗しました。");
        });
})();
