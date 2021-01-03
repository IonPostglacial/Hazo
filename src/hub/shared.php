<?php
require_once("libs/common/tools.php");
require_once("libs/common/Client.php");
require_once("libs/common/FileSharing.php");

function isArgumentValid() {
    return isset($_GET["linkid"]);
}

function handleRequest() {
    $client = Client::getCurrent();
    $client->ensureConnection();
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