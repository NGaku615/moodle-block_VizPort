//@vizualize
//@label 成績のヒートマップ
// @id grade_heatmap

(function () {
    // ===== 設定 =====
    const BINS = 10; // 縦軸：10段階
    const MARGIN = { top: 40, right: 20, bottom: 40, left: 100 };
    const CELL_W = 26;
    const CELL_PAD = 1;

    // URLから course id 取得
    const course = new URL(window.location.href).searchParams.get("id");

    // データ取得（固定キー: { [quizid]: { quizname, grades:[{userid, grade}, ...] } }）
    d3.json(`${M.cfg.wwwroot}/blocks/listallcourses/logjson.php?select=4&id=${course}`)
        .then(json => renderHeatmap(normalize(json)))
        .catch(err => console.error("成績データの取得に失敗:", err));

    // ---- 正規化 ----
    function normalize(obj) {
        const arr = Object.entries(obj).map(([quizid, v]) => ({
            quizid: +quizid,
            quizname: v.quizname,
            grades: Array.isArray(v.grades)
                ? v.grades
                    .filter(g => g && g.grade != null && !isNaN(+g.grade))
                    .map(g => ({ userid: +g.userid, score: +g.grade }))
                : []
        }));
        arr.sort((a, b) => a.quizname.localeCompare(b.quizname, 'ja'));
        return arr;
    }

    // 各テスト内でmin/maxスケーリング→10段階
    function aggregateToDeciles(quizzes) {
        const rows = [];
        const quizNames = [];
        const maxCountPerQuiz = [];

        quizzes.forEach(q => {
            quizNames.push(q.quizname);
            const scores = q.grades.map(g => g.score);
            if (scores.length === 0) {
                maxCountPerQuiz.push(0);
                rows.push(new Array(BINS).fill(0));
                return;
            }

            let min = d3.min(scores), max = d3.max(scores);
            if (max === min) max = min + 1;

            const counts = new Array(BINS).fill(0);
            scores.forEach(s => {
                let t = (s - min) / (max - min);
                if (t < 0) t = 0;
                if (t > 1) t = 1;
                let idx = Math.floor(t * BINS);
                if (idx === BINS) idx = BINS - 1;
                counts[idx]++;
            });

            rows.push(counts);
            maxCountPerQuiz.push(d3.max(counts));
        });

        const globalMax = d3.max(maxCountPerQuiz) || 1;
        return { rows, quizNames, globalMax };
    }

    function renderHeatmap(quizzes) {
        const { rows, quizNames, globalMax } = aggregateToDeciles(quizzes);

        const host = d3.select('#grade_heatmap');
        host.selectAll('*').remove();

        const innerH = Math.max(260, BINS * 26);
        const innerW = quizNames.length * CELL_W;

        const svg = host.append('svg')
            .attr('width', innerW + MARGIN.left + MARGIN.right)
            .attr('height', innerH + MARGIN.top + MARGIN.bottom);

        const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

        // 上が10、下が1になるようにスケールを反転させる
        const x = d3.scaleBand().domain(quizNames).range([0, innerW]).paddingInner(0.05);
        const y = d3.scaleBand().domain(d3.range(BINS)).range([0, innerH]).paddingInner(0); // ← 修正（上が10）
        const color = d3.scaleSequential(d3.interpolateYlGnBu).domain([0, globalMax]);

        // セル描画（上=10, 下=1）
        quizNames.forEach((quiz, qi) => {
            const col = g.append('g').attr('transform', `translate(${x(quiz)},0)`);
            const counts = rows[qi];

            col.selectAll('rect.cell')
                .data(counts.map((v, bi) => ({ v, bi })))
                .join('rect')
                .attr('x', CELL_PAD / 2)
                .attr('y', d => y(BINS - 1 - d.bi) + CELL_PAD / 2) // ← 反転して上を10に
                .attr('width', x.bandwidth() - CELL_PAD)
                .attr('height', Math.max(1, y.bandwidth() - CELL_PAD))
                .attr('fill', d => d.v === 0 ? '#f5f5f5' : color(d.v))
                .attr('stroke', '#eee');
        });

        // 軸（クイズ名：下）
        const xAxis = d3.axisBottom(x).tickSize(0);
        g.append('g')
            .attr('transform', `translate(0,${innerH})`)
            .call(xAxis)
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('transform', 'rotate(-45)')
            .style('font-size', '11px');

        // 縦軸（上が10, 下が1）
        const yAxis = d3.axisLeft(
            d3.scaleBand().domain(d3.range(BINS).map(i => String(BINS - i))).range([0, innerH])
        );
        g.append('g').call(yAxis).selectAll('text').style('font-size', '12px');

        // 軸ラベル
        svg.append('text')
            .attr('x', MARGIN.left + innerW / 2)
            .attr('y', MARGIN.top + innerH + 34)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('クイズ');

        svg.append('text')
            .attr('x', MARGIN.left - 60)
            .attr('y', MARGIN.top + innerH / 2)
            .attr('text-anchor', 'middle')
            .attr('transform', `rotate(-90, ${MARGIN.left - 60}, ${MARGIN.top + innerH / 2})`)
            .style('font-size', '12px');
    }
})();
