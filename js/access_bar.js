//@vizualize
//@label アクセス棒グラフ
// @id access_bar

(function () {
    'use strict';

    // ===== ユーティリティ =====
    function aggregateCounts(data) {
        // {label: count} を返す
        const counts = Object.create(null);

        if (Array.isArray(data)) {
            // 例: [{ name: '課題1', userid: 1, timecreated: 123 }, ...]
            for (const item of data) {
                const label = (item && item.name) ? String(item.name) : '(不明)';
                counts[label] = (counts[label] || 0) + 1;
            }
            return counts;
        }

        if (data && typeof data === 'object') {
            // 例: { '課題1': [{...}, {...}], 'フォーラムA': [{...}] }
            for (const [labelRaw, arr] of Object.entries(data)) {
                const label = String(labelRaw || '(不明)');
                const n = Array.isArray(arr) ? arr.length : 0;
                counts[label] = (counts[label] || 0) + n;
            }
            return counts;
        }

        return counts;
    }

    function toSeries(counts, topN) {
        const rows = Object.entries(counts)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value);

        const sliced = (typeof topN === 'number' && topN > 0) ? rows.slice(0, topN) : rows;
        return {
            labels: sliced.map(r => r.label),
            values: sliced.map(r => r.value)
        };
    }

    function renderBar(canvas, labels, values, title) {
        if (!window.Chart) {
            console.warn('Chart.js が読み込まれていません。<script src="https://cdn.jsdelivr.net/npm/chart.js"></script> を追加してください。');
            return;
        }
        const ctx = canvas.getContext('2d');

        if (canvas._barInstance) {
            canvas._barInstance.destroy();
            canvas._barInstance = null;
        }

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'アクセス数',
                    data: values,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title || 'コンテンツ別アクセス数'
                    },
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `アクセス数: ${ctx.raw}`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { maxRotation: 45, autoSkip: true, autoSkipPadding: 8 }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 }
                    }
                }
            }
        });

        canvas._barInstance = chart;
        return chart;
    }

    // ===== メイン処理 =====
    (async function main() {
        // キャンバスを準備
        const container = document.getElementById('access_bar');
        if (!container) {
            console.warn('charts_sample コンテナが見つかりません');
            return;
        }
        const canvas = document.createElement('canvas');
        canvas.id = 'baraccess';
        // 高さはデータ量に応じて多少余裕を持たせる（最大600px）
        canvas.style.minHeight = '360px';
        canvas.style.height = '420px';
        container.appendChild(canvas);

        // データ取得
        const endpoint = blockVizPortApi.fetchLogJson(5);
        let srcData;
        try {
            srcData = endpoint;
        } catch (e) {
            console.error('データ取得に失敗しました: ', e);
            renderBar(canvas, ['データ取得エラー'], [0], 'コンテンツ別アクセス数');
            return;
        }

        // 集計 → 上位N件
        console.log('取得データ', endpoint);
        const counts = aggregateCounts(endpoint);
        const TOP_N = 20; // 表示件数を調整したい場合はここを変更
        const { labels, values } = toSeries(counts, TOP_N);

        // データが空の場合のフォールバック
        if (labels.length === 0) {
            renderBar(canvas, ['データなし'], [0], 'コンテンツ別アクセス数');
            return;
        }

        // ラベル数が多い場合は高さを少し拡張
        if (labels.length > 20) {
            canvas.style.height = '560px';
        } else if (labels.length > 30) {
            canvas.style.height = '600px';
        }

        // 描画
        renderBar(canvas, labels, values, 'コンテンツ別アクセス数');

        // デバッグ
        console.log('集計結果', { counts, labels, values, endpoint });
    })();
})();
