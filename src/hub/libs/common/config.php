<?php
const DEVELOPMENT_MODE = 0;
const PRODUCTION_MODE = 1;

const MODE = DEVELOPMENT_MODE;
define("PRIVATE_FOLDER", dirname(__FILE__) . "/../../private");

if (MODE === DEVELOPMENT_MODE) {
    define("DEBUG_MODE_ENABLED", true);
}
if (MODE === PRODUCTION_MODE) {
    define("DEBUG_MODE_ENABLED", false);
}
