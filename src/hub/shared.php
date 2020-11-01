<?php
include_once("lib/tools.php");
include_once("lib/FileSharing.php");

ensureClientConnection();

function isArgumentValid() {
    return isset($_GET["linkid"]);
}

function handleRequest() {
    if (isArgumentValid()) {
        $linkId = $_GET["linkid"];
        $pdo = getDataDbHandle();
        $sharing = FileSharing::getFromLinkId($pdo, $linkId);
        if (file_exists($sharing->filePath)) {
            header("Content-type: application/json");
            header('Content-Disposition: attachment; filename="' . basename($sharing->filePath) . '"');
            echo file_get_contents($sharing->filePath);
        } else {
            return replyNotFound();
        }
    } else {
        echo replyBadRequest();
    }
}

handleRequest();