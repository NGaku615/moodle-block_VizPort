// logjson.js
// - URL から id (courseid) を取得
// - select の値だけ渡して fetchdata.php を呼び出す
// グローバル: window.blockVizPortApi に公開

(function (window) {
    'use strict';

    /** Moodle判定：M が存在していて wwwroot があると Moodle */
    var IS_MOODLE =
        typeof M !== 'undefined' &&
        M.cfg &&
        typeof M.cfg.wwwroot === 'string';

    /** fectchdata.php のパス（Moodle時のみ使用） */
    var BASE_URL = IS_MOODLE
        ? M.cfg.wwwroot + "/blocks/vizport/fetchdata.php"
        : null;

    /**
     * 現在の URL からクエリパラメータを取得
     * @param {string} name
     * @returns {string|null}
     */
    function getQueryParam(name) {
        if (typeof window === 'undefined' || !window.location) {
            return null;
        }
        try {
            var url = new URL(window.location.href);
            return url.searchParams.get(name);
        } catch (e) {
            // 古いブラウザなどで URL コンストラクタが無い場合のフォールバック
            var query = window.location.search || '';
            if (query.charAt(0) === '?') {
                query = query.substring(1);
            }
            var parts = query.split('&');
            for (var i = 0; i < parts.length; i++) {
                var pair = parts[i].split('=');
                if (decodeURIComponent(pair[0]) === name) {
                    return pair.length > 1 ? decodeURIComponent(pair[1]) : '';
                }
            }
            return null;
        }
    }

    /**
     * コースIDを URL (?id=xxx) から取得
     *   例) /course/view.php?id=3 → "3"
     */
    function getCourseId() {
        return getQueryParam('id');
    }

    /**
     * select の値に応じて、fetchdata.php に渡すクエリを組み立てる
     *  - id は URL から自動で付与
     *  - select=1 or 5 のときだけ start/end も URL から付ける（あれば）
     *
     * @param {number} select
     * @returns {string} クエリ文字列 (例: "select=6&id=3")
     */
    function buildQueryString(select) {
        var params = [];

        // 必須: select
        params.push('select=' + encodeURIComponent(String(select)));

        // 共通: id (courseid)
        var courseid = getCourseId();
        if (courseid !== null && courseid !== undefined && courseid !== '') {
            params.push('id=' + encodeURIComponent(String(courseid)));
        }

        // select=1 or 5 のときだけ start/end を付ける
        if (select === 1 || select === 5) {

            let start = null;
            let end = null;

            var startEl = document.querySelector('#start-unix');
            var endEl = document.querySelector('#end-unix');


            if (startEl) start = startEl.value;
            if (endEl) end = endEl.value;

            if (start !== null && start !== '') {
                params.push('start=' + encodeURIComponent(String(start)));
            }
            if (end !== null && end !== '') {
                params.push('end=' + encodeURIComponent(String(end)));
            }
        }

        return params.join('&');
    }
    /** ダミーデータ生成 */
    function makeDummyData(select) {
        const now = Math.floor(Date.now() / 1000);

        switch (select) {

            // =========================
            // select = 1
            // start〜end の間のログ一覧
            // 返り値：idをキーにしたオブジェクト
            // =========================
            case 1: {
                return {
                    "54291": {
                        id: "54291",
                        eventname: "\\core\\event\\dashboard_viewed",
                        component: "core",
                        action: "viewed",
                        target: "dashboard",
                        objecttable: "user",
                        objectid: "2",
                        crud: "r",
                        edulevel: "0",
                        contextid: "1",
                        contextlevel: "10",
                        contextinstanceid: "0",
                        userid: "2",
                        courseid: "0",
                        relateduserid: null,
                        anonymous: "0",
                        other: "{\"username\":\"admin\",\"extrauserinfo\":[]}",
                        timecreated: String(now - 3000),
                        origin: "web",
                        ip: "0:0:0:0:0:0:0:1",
                        realuserid: null
                    },
                    "54292": {
                        id: "54292",
                        eventname: "\\core\\event\\user_loggedin",
                        component: "core",
                        action: "loggedin",
                        target: "user",
                        objecttable: "user",
                        objectid: "9",
                        crud: "r",
                        edulevel: "0",
                        contextid: "2",
                        contextlevel: "10",
                        contextinstanceid: "9",
                        userid: "9",
                        courseid: "0",
                        relateduserid: null,
                        anonymous: "0",
                        other: "{\"username\":\"student1\",\"extrauserinfo\":[]}",
                        timecreated: String(now - 2000),
                        origin: "web",
                        ip: "192.0.2.10",
                        realuserid: null
                    }
                };
            }

            // =========================
            // select = 2
            // 今日から4週間分を週ごとに区切ったログ
            // 返り値：week_1〜week_4 をキーにしたオブジェクト
            // =========================
            case 2: {
                return {
                    week_1: [],
                    week_2: [
                        {
                            id: "54153",
                            eventname: "\\core\\event\\user_loggedin",
                            component: "core",
                            action: "loggedin",
                            target: "user",
                            objecttable: "user",
                            objectid: "10",
                            crud: "r",
                            edulevel: "0",
                            contextid: "3",
                            contextlevel: "10",
                            contextinstanceid: "10",
                            userid: "10",
                            courseid: "0",
                            relateduserid: null,
                            anonymous: "0",
                            other: "{\"username\":\"student2\",\"extrauserinfo\":[]}",
                            timecreated: String(now - 14 * 24 * 3600),
                            origin: "web",
                            ip: "192.0.2.20",
                            realuserid: null
                        }
                    ],
                    week_3: [
                        {
                            id: "54180",
                            eventname: "\\mod_quiz\\event\\attempt_submitted",
                            component: "mod_quiz",
                            action: "submitted",
                            target: "attempt",
                            objecttable: "quiz_attempts",
                            objectid: "123",
                            crud: "c",
                            edulevel: "2",
                            contextid: "15",
                            contextlevel: "70",
                            contextinstanceid: "45",
                            userid: "9",
                            courseid: "3",
                            relateduserid: null,
                            anonymous: "0",
                            other: "{\"quizid\":1}",
                            timecreated: String(now - 17 * 24 * 3600),
                            origin: "web",
                            ip: "192.0.2.30",
                            realuserid: null
                        }
                    ],
                    week_4: [
                        {
                            id: "54210",
                            eventname: "\\mod_assign\\event\\submission_created",
                            component: "mod_assign",
                            action: "submitted",
                            target: "submission",
                            objecttable: "assign_submission",
                            objectid: "55",
                            crud: "c",
                            edulevel: "2",
                            contextid: "20",
                            contextlevel: "70",
                            contextinstanceid: "50",
                            userid: "11",
                            courseid: "3",
                            relateduserid: null,
                            anonymous: "0",
                            other: "{\"assignid\":2}",
                            timecreated: String(now - 24 * 24 * 3600),
                            origin: "web",
                            ip: "192.0.2.40",
                            realuserid: null
                        }
                    ]
                };
            }

            // =========================
            // select = 3
            // クイズの成績をクイズ毎にまとめて取得
            // 返り値：quizid をキーにしたオブジェクト
            // =========================
            case 3: {
                return {
                    1: {
                        quizname: "quiz1",
                        grades: [
                            { userid: "9", grade: 80 },
                            { userid: "11", grade: 65 },
                            { userid: "33", grade: 92 },
                            { userid: "8", grade: 74 }
                        ]
                    },
                    2: {
                        quizname: "quiz2",
                        grades: [
                            { userid: "9", grade: 70 },
                            { userid: "11", grade: 88 },
                            { userid: "33", grade: 60 }
                        ]
                    }
                };
            }

            // =========================
            // select = 4
            // コースモジュールごとのアクセス履歴
            // 返り値：モジュール名をキーに、[{userid, timecreated}, …] の配列
            // =========================
            case 4: {
                return {
                    "Section 1": [
                        { userid: "2", timecreated: String(now - 3600) },
                        { userid: "2", timecreated: String(now - 1800) }
                    ],
                    "quiz1": [
                        { userid: "9", timecreated: String(now - 4000) },
                        { userid: "11", timecreated: String(now - 3500) }
                    ],
                    "courseForum": [
                        { userid: "9", timecreated: String(now - 7200) },
                        { userid: "33", timecreated: String(now - 6500) },
                        { userid: "11", timecreated: String(now - 6400) }
                    ]
                };
            }

            // =========================
            // select = 5
            // コースに登録されている学生一覧
            // 返り値：配列
            // =========================
            case 5: {
                return [
                    {
                        id: "6",
                        firstname: "anonfirstname4",
                        lastname: "anonlastname4",
                        username: "anon4",
                        email: "anon4@doesntexist.invalid"
                    },
                    {
                        id: "7",
                        firstname: "anonfirstname5",
                        lastname: "anonlastname5",
                        username: "anon5",
                        email: "anon5@doesntexist.invalid"
                    },
                    {
                        id: "8",
                        firstname: "anonfirstname6",
                        lastname: "anonlastname6",
                        username: "anon6",
                        email: "anon6@doesntexist.invalid"
                    }
                ];
            }

            // =========================
            // select = 6
            // 小テストごとに提出済み人数
            // 返り値：配列
            // =========================
            case 6: {
                return [
                    { quizid: "1", quizname: "Quiz1", finished_user_count: "70" },
                    { quizid: "2", quizname: "Quiz2", finished_user_count: "80" },
                    { quizid: "3", quizname: "Quiz3", finished_user_count: "90" }
                ];
            }

            // =========================
            // select = 7
            // 課題ごとに提出済み人数
            // 返り値：配列
            // =========================
            case 7: {
                return [
                    { assignid: "1", assignname: "additional assignment", submitted_user_count: "26" },
                    { assignid: "2", assignname: "assignment1", submitted_user_count: "81" },
                    { assignid: "3", assignname: "assignment2", submitted_user_count: "81" }
                ];
            }

            // デフォルト（知らない select のとき）
            default:
                return {};
        }
    }

    /** 本番API */
    function fetchReal(select) {
        var url = BASE_URL + "?" + buildQueryString(select);

        return fetch(url, {
            method: "GET",
            credentials: "same-origin",
            headers: { "Accept": "application/json" }
        }).then(function (res) {
            if (!res.ok) {
                throw new Error("HTTP " + res.status);
            }
            return res.json();
        });
    }

    /** 公開API：selectだけ渡せばよい */
    function fetchLogJson(select) {
        if (!IS_MOODLE) {
            // ダミーHTMLならダミーデータで可視化OK
            return Promise.resolve(makeDummyData(select));
        } else {
            return fetchReal(select);
        }
    }

    // ==== ここから外部に出す API ====
    // グローバルに 1つだけ namespaced オブジェクトを作る
    window.blockVizPortApi = {
        // 本番用: select の値だけ渡して fetchdata.php を叩く
        fetchLogJson: fetchLogJson
    };

})(window);
