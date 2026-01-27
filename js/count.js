//@vizualize
//@label ログ合計
// @id count   
(function () {

    // 文字列としてURLを取得する。

    const log = blockVizPortApi.fetchLogJson(8);

    blockListAllCoursesApi.fetchLogJson(0).then(function (res) {
        console.log("USER ROLES:", res.roles);
    });


    Promise.all([log])
        .then(function ([data]) {
            //let count = Object.keys(data).length;
            //d3.select(`#count`)
            //    .text(`ログデータの数: ${count}`);
            console.log(log);
        })
        .catch((error) => {
            console.error("Error loading JSON data:", error);
        });

})();