<?php
// This file is part of Moodle - https://moodle.org/
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
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Block listallcourses is defined here.
 *
 * @package     block_listallcourses
 * @copyright   2024 Nakao Gaku <Admin@NGaku615.com>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class block_vizport extends block_base
{

    /**
     * Initializes class member variables.
     */
    public function init()
    {
        // Needed by Moodle to differentiate between blocks.
        $this->title = get_string('pluginname', 'block_vizport');
    }

    /**
     * Returns the block contents.
     *
     * @return stdClass The block contents.
     */
    public function get_content()
    {
        global $CFG, $DB, $USER, $PAGE;

        $PAGE->requires->js('/blocks/vizport/js/jquery-3.6.3.min.js');
        $PAGE->requires->js('/blocks/vizport/js/main.js');
        $PAGE->requires->js('/blocks/vizport/js/logjson.js');
        $PAGE->requires->css('/blocks/vizport/css/style.css');
        $PAGE->requires->css(new moodle_url('https://cdn.jsdelivr.net/npm/pikaday/css/pikaday.css'));
        $PAGE->requires->js(new moodle_url('https://cdn.jsdelivr.net/npm/pikaday/pikaday.js'), true);

        if ($this->content !== null) {
            return $this->content;
        }

        if (empty($this->instance)) {
            $this->content = '';
            return $this->content;
        }

        $this->content = new stdClass();
        $this->content->items = array();
        $this->content->icons = array();
        $this->content->footer = '';

        if (!empty($this->config->text)) {
            $this->content->text = "Hello Ram";
        } else {
            $dir = $CFG->dirroot . '/blocks/vizport/js';
            $jsFiles = glob($dir . '/*.js');
            $filter2 = '
            <div class="vizselect">
            <span class="header">Select units</span>
            <select multiple name="js-file" id="js-file">
            ';
            foreach ($jsFiles as $file) {
                $filename = basename($file);

                //ファイルの先頭5行を読み込む
                $handle = fopen($file, 'r');
                $lines = '';
                if ($handle) {
                    for ($i = 0; $i < 5; $i++) {
                        $line = fgets($handle);
                        if ($line === false) {
                            break; // ファイルの終わりに到達
                        }
                        $lines .= $line;
                    }
                    fclose($handle);
                }

                //ファイルの先頭に`vizualize`が含まれているかチェック
                if (strpos($lines, 'vizualize') === false) {
                    continue; // `visualize`が含まれていない場合はスキップ
                }

                // メタ情報を抽出
                preg_match('/@label\s+(.*)/', $lines, $labelMatch);
                preg_match('/@id\s+(.*)/', $lines, $idMatch);

                $label = isset($labelMatch[1]) ? trim($labelMatch[1]) : $filename;
                $id = isset($idMatch[1]) ? trim($idMatch[1]) : pathinfo($filename, PATHINFO_FILENAME);

                $filter2 .= '<option value="' . $filename . '" data-id="' . $id . '">' . $label . '</option>';
            }
            $filter2 .= '</select>
            </div>
            ';
            $text = $filter2;
            $text .= '<script src="https://d3js.org/d3.v7.min.js"></script>';
            $text .= '<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>';
            $text .= '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>';
            $text .= '<div id=outputArea></div>';

            $this->content->text = $text;
            $this->content->text .= '
                <label>Start:</label><br>
                <input type="text" id="start-date" name="start_date" readonly style="margin-bottom:8px;"><br>

                <label>End:</label><br>
                <input type="text" id="end-date" name="end_date" readonly style="margin-bottom:8px;"><br>

                <!-- 変換後のUNIX秒を保持するhidden -->
                <input type="hidden" id="start-unix" name="start_unix">
                <input type="hidden" id="end-unix" name="end_unix">

                <button id="submit-range">Enter</button>
            ';
            $PAGE->requires->js_init_code("
                const picker1 = new Pikaday({
                    field: document.getElementById('start-date'),
                    format: 'YYYY-MM-DD'
                });
                const picker2 = new Pikaday({
                    field: document.getElementById('end-date'),
                    format: 'YYYY-MM-DD'
                });
            ");
        }
        return $this->content;
    }

    /**
     * Defines configuration data.
     *
     * The function is called immediately after init().
     */
    public function specialization()
    {

        // Load user defined title and make sure it's never empty.
        if (empty($this->config->title)) {
            $this->title = get_string('pluginname', 'block_vizport');
        } else {
            $this->title = $this->config->title;
        }
    }

    /**
     * Enables global configuration of the block in settings.php.
     *
     * @return bool True if the global configuration is enabled.
     */
    public function has_config()
    {
        return true;
    }

    /**
     * Sets the applicable formats for the block.
     *
     * @return string[] Array of pages and permissions.
     */
    public function applicable_formats()
    {
        return array(
            'all' => true
        );
    }

    public function _self_test()
    {
        return true;
    }
}
