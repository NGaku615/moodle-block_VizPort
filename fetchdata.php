<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Create the JSON file with nodes and edges data
 *
 * @package     blocks_listallcourses
 * @copyright   2024 Nakao Gaku <Admin@NGaku615.com>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

use tool_brickfield\local\areas\mod_choice\option;

require_once('../../config.php');

require_login();

function respond_json($data) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
//認証

$select = optional_param('select', null, PARAM_INT); //Select the API to use via the "select" menu
$courseid = optional_param('id', null, PARAM_INT);
global $DB, $USER;

// id が無い/不正なら JSON エラーで返す（落ちない）
if (empty($courseid)) {
    respond_json(['error' => 'missing course id (id param)']);
}

$context = context_course::instance($courseid);
$roles = get_user_roles($context, $USER->id, false);

$roles_shortname = [];
foreach ($roles as $role) {
    $roles_shortname[] = $role->shortname;
}

// 教員・管理系ロール判定（これらなら匿名化しない）
$privilegedroles = ['editingteacher', 'teacher', 'manager', 'admin'];
$isprivileged = false;
foreach ($roles_shortname as $r) {
    if (in_array($r, $privilegedroles, true)) {
        $isprivileged = true;
        break;
    }
}

function make_userid_remapper() {
    $map = [];
    $next = 1;

    return function($orig) use (&$map, &$next) {
        $k = (string)$orig;
        if (!isset($map[$k])) {
            $map[$k] = $next;
            $next++;
        }
        return $map[$k];
    };
}

if ($select == 0) {
    respond_json([
        'userid' => (int)$USER->id,
        'courseid' => (int)$courseid,
        'roles' => $roles_shortname,
    ]);
}

if($select == 1){
  $start = optional_param('start', null, PARAM_INT);
  $end = optional_param('end', null, PARAM_INT);

  $sql = "SELECT *
      FROM {logstore_standard_log}
        WHERE courseid = :courseid
          AND timecreated >= :starttime
          AND timecreated <= :endtime
        ORDER BY timecreated ASC";

    $params = [
      'courseid'   => $courseid,
      'starttime'  => $start,
      'endtime'    => $end,
    ];
  $sectionLogs = $DB->get_records_sql($sql, $params);

  if (!$isprivileged) {
    $remap = make_userid_remapper();
    foreach ($sectionLogs as $k => $log) {
        if (isset($log->userid)) {
            $sectionLogs[$k]->userid = $remap($log->userid);
        }
    }
  }
  
  $json = json_encode($sectionLogs);

  header('Content-Type: application/json; charset=utf-8');
  echo $json;
} elseif($select == 2){
  function report_visualizing_get_logs_split_by_week_mon_to_sun($courseid) {
    global $DB;

    $now = time();
    $oneweek = 7 * 24 * 60 * 60;

    // 今週の月曜0時を基準点にする
    $dayofweek = date('w', $now); // 日曜:0〜土曜:6
    $days_since_monday = ($dayofweek + 6) % 7;
    $monday_this_week = strtotime("-{$days_since_monday} days", strtotime(date('Y-m-d 00:00:00', $now)));

    // 4週間前の月曜0時
    $starttime = $monday_this_week - (3 * $oneweek);

    // SQLは1回だけ（4週間分）
    $sql = "SELECT *
            FROM {logstore_standard_log}
            WHERE courseid = :courseid
              AND timecreated >= :starttime";

    $params = [
        'courseid' => $courseid,
        'starttime' => $starttime,
    ];

    $alllogs = $DB->get_records_sql($sql, $params);

    // 週ごとに分類する配列（週番号は古い順に week_1〜新しい順に week_4）
    $weeklylogs = [
        "week_1" => [],
        "week_2" => [],
        "week_3" => [],
        "week_4" => [],
    ];

    foreach ($alllogs as $log) {
        $time = $log->timecreated;

        // 各週の月曜0時〜翌週の月曜0時で区切る
        for ($i = 0; $i < 4; $i++) {
            $start = $monday_this_week - ((3 - $i) * $oneweek);
            $end = $start + $oneweek;

            if ($time >= $start && $time < $end) {
                $key = "week_" . ($i + 1);
                $weeklylogs[$key][] = $log;
                break;
            }
        }
    }

    return $weeklylogs;
  }

  $logs_by_week = report_visualizing_get_logs_split_by_week_mon_to_sun($courseid);

  if (!$isprivileged) {
    $remap = make_userid_remapper();
    foreach ($logs_by_week as $week => $arr) {
        foreach ($arr as $i => $log) {
            if (isset($log->userid)) {
                $logs_by_week[$week][$i]->userid = $remap($log->userid);
            }
        }
    }
  }

  $json = json_encode($logs_by_week, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

  header('Content-Type: application/json; charset=utf-8');
  echo $json;
} elseif($select == 3){//Get quiz grades grouped by quiz

  $quizzes = $DB->get_records('quiz', ['course' => $courseid], '', 'id,name');

  $sql_quiz_grade = "SELECT *
          FROM {quiz_grades}
          WHERE quiz = :quizid";

  $quiz_grades = [];

  foreach($quizzes as $quizid => $quiz){
    $grades = $DB->get_records('quiz_grades', ['quiz' => $quizid], '', 'userid,grade');

    $grade_rows = [];
    foreach($grades as $g){
      $grade_rows[] = [
        'userid' => $g->userid,
        'grade' => (int)$g->grade
      ];
    }
    $quiz_grades[$quizid] = [
      'quizname' => $quiz->name,
      'grades' => $grade_rows
    ];
  }

  if (!$isprivileged) {
    $remap = make_userid_remapper();
    foreach ($quiz_grades as $quizid => $bundle) {
        if (!empty($bundle['grades'])) {
            foreach ($bundle['grades'] as $i => $row) {
                if (isset($row['userid'])) {
                    $quiz_grades[$quizid]['grades'][$i]['userid'] = $remap($row['userid']);
                }
            }
        }
    }
  }

  $json = json_encode($quiz_grades, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

  header('Content-Type: application/json; charset=utf-8');
  echo $json;
}elseif($select == 4){ //モジュールごとにユーザのアクセス履歴を取得
  $starttime = optional_param('start', null, PARAM_INT);
  $endtime = optional_param('end', null, PARAM_INT);
  $sql_section = "SELECT id,userid,other,timecreated FROM {logstore_standard_log} AS lsl WHERE lsl.courseid = $courseid AND lsl.contextlevel = 50 AND lsl.timecreated >= $starttime AND lsl.timecreated < $endtime";
  $sectionLogs = $DB->get_records_sql($sql_section);
  foreach($sectionLogs as $key => $sectionLog){
    if(strpos($sectionLog->other,'coursesectionnumber') === false){
      unset($sectionLogs[$key]);
    }else{
      $array = json_decode($sectionLog->other,true);
      $sectionLogs[$key]->other = $array["coursesectionnumber"];
    }
  }
  foreach($sectionLogs as $key => $sectionLog){
    $sql = "SELECT id,name FROM {course_sections} AS cs WHERE cs.course = $courseid AND cs.section = " . $sectionLogs[$key]->other;
    $sectionName = $DB->get_record_sql($sql);
    $sectionLogs[$key]->other = $sectionName->name;
  }
  // モジュールへのアクセスログを取得
  $sql_module = "SELECT id,userid,contextinstanceid,timecreated FROM {logstore_standard_log} AS lsl WHERE lsl.courseid = $courseid AND lsl.contextlevel = 70 AND lsl.timecreated >= $starttime AND lsl.timecreated < $endtime";
  $context_logs = $DB->get_records_sql($sql_module);
  foreach($context_logs as $key => $context_log){
    $sql = "SELECT id,module,instance FROM {course_modules} AS cm WHERE cm.id = $context_log->contextinstanceid";
    $course_module = $DB->get_record_sql($sql);
    $sql = "SELECT id,name FROM {modules} AS m WHERE m.id = $course_module->module";
    $module = $DB->get_record_sql($sql);
    $sql = "SELECT id,name FROM {". $module->name . "} AS m WHERE m.id = $course_module->instance";
    $moduleName = $DB->get_record_sql($sql);
    $context_logs[$key]->contextinstanceid = $moduleName->name;
  }

  // 2つのアクセスログを合わせる
  $log_day = array();
  foreach ($context_logs as $cl) {
    $log_day[] = array(
        'name' => $cl->contextinstanceid, // モジュール（活動）名
        'timecreated' => $cl->timecreated,
        'userid' => $cl->userid
    );
  }
  foreach ($sectionLogs as $sl) {
    $log_day[] = array(
        'name' => $sl->other, // セクション名
        'timecreated' => $sl->timecreated,
        'userid' => $sl->userid
    );
  }

  // 時系列で並び替え
  usort($log_day,function($a,$b){
    return $a['timecreated'] - $b['timecreated'];
  });

  // ★ここを「ユーザごと」→「モジュール名ごと」に変更
  $log_sort = array();
  foreach ($log_day as $item) {
    $modname = $item["name"];          // グルーピングキーをモジュール（またはセクション）名に
    if (!isset($log_sort[$modname])) {
        $log_sort[$modname] = array();
    }
    $log_sort[$modname][] = array(
        'userid' => $item["userid"],   // 逆にユーザは中身へ
        'timecreated' => $item['timecreated']
    );
  }

  if (!$isprivileged) {
    $remap = make_userid_remapper();
    foreach ($log_sort as $modname => $items) {
        foreach ($items as $i => $row) {
            if (isset($row['userid'])) {
                $log_sort[$modname][$i]['userid'] = $remap($row['userid']);
            }
        }
    }
  }
  
  $json = json_encode($log_sort, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

  header('Content-Type: application/json; charset=utf-8');
  echo $json;
}elseif ($select == 5) { // コースに登録されている学生一覧を取得
  $now = time();

  $sql = "
    SELECT DISTINCT u.id, u.firstname, u.lastname, u.username, u.email
    FROM {role_assignments} ra
    JOIN {role} r    ON r.id = ra.roleid AND r.shortname = 'student'
    JOIN {context} c ON c.id = ra.contextid
                    AND c.contextlevel = 50
                    AND c.instanceid  = :courseid1
    JOIN {user} u ON u.id = ra.userid
    JOIN {user_enrolments} ue ON ue.userid = u.id
    JOIN {enrol} e ON e.id = ue.enrolid AND e.courseid = :courseid2
    WHERE ue.status = 0
      AND e.status  = 0
      AND u.deleted = 0
      AND u.suspended = 0
      AND (ue.timestart = 0 OR ue.timestart <= :now1)
      AND (ue.timeend   = 0 OR ue.timeend   >  :now2)
  ";

  $params = [
    'courseid1' => $courseid,
    'courseid2' => $courseid,
    'now1'      => $now,
    'now2'      => $now,
  ];

  $students = $DB->get_records_sql($sql, $params);

  $students = array_values($students);
  if (!$isprivileged) {
    $remap = make_userid_remapper();
    foreach ($students as $i => $u) {
        if (isset($u->id)) {
            $students[$i]->id = $remap($u->id);
        }
    }
}

  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(array_values($students), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}elseif ($select == 6) { // 小テストごとの提出済み人数
  $sql = "
    SELECT q.id AS quizid, q.name AS quizname, COUNT(DISTINCT qa.userid) AS finished_user_count
    FROM {quiz} q
    LEFT JOIN {quiz_attempts} qa ON qa.quiz = q.id AND qa.state = 'finished'
    WHERE q.course = :courseid
    GROUP BY q.id, q.name
    ORDER BY q.id
  ";
  $params = ['courseid' => $courseid];
  $records = $DB->get_records_sql($sql, $params);

  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(array_values($records), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}elseif ($select == 7) { // 課題ごとの提出済み学生数
  $sql = "
    SELECT a.id AS assignid, a.name AS assignname, COUNT(DISTINCT s.userid) AS submitted_user_count
    FROM {assign} a
    LEFT JOIN {assign_submission} s
      ON s.assignment = a.id AND s.status = 'submitted'
    WHERE a.course = :courseid
    GROUP BY a.id, a.name
    ORDER BY a.id
  ";
  $params = ['courseid' => $courseid];
  $records = $DB->get_records_sql($sql, $params);

  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(array_values($records), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
