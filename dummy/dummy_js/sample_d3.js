//@vizualize
//@label D3.jsのサンプル
//@id script

console.log("sample_d3.js loaded");

// dummy_shell.html が自動で <div id="script"> を生成してくれる
const root = document.getElementById("script");

if (root) {
    root.innerHTML = "<p>ここに D3.js で描画します。</p>";
    // 例えば:
    // const svg = d3.select("#script").append("svg") ...
}
