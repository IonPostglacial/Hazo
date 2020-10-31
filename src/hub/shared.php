<?php
include_once("lib/tools.php");

ensureClientConnection();

function getFilePathForLinkId(PDO $pdo, string $linkId) {
    $statement = $pdo->prepare("SELECT filePath FROM FileSharing WHERE shareLink = ?");
    $statement->execute([$linkId]);
    $filePath = $statement->fetch();
    return $filePath["filePath"];
}

function isArgumentValid() {
    return isset($_GET["linkid"]);
}

function handleRequest() {
    if (isArgumentValid()) {
        $linkId = $_GET["linkid"];
        $pdo = getDataDbHandle();
        $filePath = getFilePathForLinkId($pdo, $linkId);
        if (file_exists($filePath)) {
            header("Content-type: application/json");
            header('Content-Disposition: attachment; filename="' . basename($filePath) . '"');
            echo file_get_contents($filePath);
        } else {
            return replyNotFound();
        }
    } else {
        echo replyBadRequest();
    }
}

handleRequest();