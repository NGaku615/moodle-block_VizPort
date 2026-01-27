<?php
// blocks/listallcourses/dummy/list_dummy_js.php
// dummy_js ディレクトリをスキャンして .js ファイルの一覧を返す
$dir = __DIR__ . '/dummy_js';
$files = [];

if (is_dir($dir)) {
    $entries = scandir($dir);
    foreach ($entries as $entry) {
        // . と .. は無視
        if ($entry === '.' || $entry === '..') {
            continue;
        }
        // 拡張子 .js だけ対象
        if (substr($entry, -3) === '.js') {
            $files[] = $entry;
        }
    }
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($files);
