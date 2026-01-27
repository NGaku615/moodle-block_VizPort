$("#submit-range").on('click', function () {
    const selectedFiles = $("#js-file").val();
    const selectedDataIds = $('#js-file option:selected').map(function () {
        return $(this).data('id');
    }).get();
    const startText = $("#start-date").val();
    const endText = $("#end-date").val();

    // ✅ UNIXタイムに変換（ローカルタイムベース）
    let startUnix = null;
    let endUnix = null;

    let startDate = new Date();
    let endDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    if (startText && endText) {
        startDate = new Date(startText);
        endDate = new Date(endText);
    }
    startUnix = Math.floor(startDate.setHours(0, 0, 0, 0) / 1000);
    endUnix = Math.floor(endDate.setHours(23, 59, 59, 999) / 1000);
    // hiddenに保持（他の処理からも参照可）
    $('#start-unix').val(startUnix);
    $('#end-unix').val(endUnix);

    // 出力エリアを毎回クリア
    $("#outputArea").empty();

    // ファイルが選択されている場合は送信
    if (selectedFiles && selectedFiles.length > 0) {
        $.ajax({
            url: '/blocks/vizport/vizajax.php',
            type: 'POST',
            data: {
                files: selectedFiles,
                dataIds: selectedDataIds
            },
            success: function (html) {
                $("#outputArea").append('<div>' + html + '</div>');
            },
            error: function () {
                $("#outputArea").append('<p>❌ ファイル送信エラー</p>');
            }
        });
    }
});
