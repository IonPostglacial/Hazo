<?php
require_once("../libs/common/tools.php");
require_once("../libs/common/FileSharing.php");
require_once("../libs/common/Client.php");

function handleRequest() {
    $client = Client::getCurrent();
    $client->ensureConnection();
    
    if (!$client->isAuthenticated()) {
        return replyForbidden();
    }
    if (empty($_POST["file"])) {
        return replyJson(["status" => "ko", "message" => "file argument is mandatory"]);
    }
    $fileName = $_POST["file"];
    $fileFullName = $client->getPersonalFilePath($fileName);
    if (!file_exists($fileFullName)) {
        return replyJson(["status" => "ko", "message" => "file '$fileName' doesn't exist"]);
    }
    $pdo = getDataDbHandle();

    $action = "share";
    if (!empty($_POST["action"])) {
        $action = $_POST["action"];
    }
    switch ($action) {
        case "share":
            $shareLink = FileSharing::generate($fileFullName);
            $shareLink->share($pdo);
            return replyJson(["status" => "ok", "linkid" => $shareLink->linkId]);
        case "unshare":
            FileSharing::unsharePath($pdo, $fileFullName);
            return replyJson(["status" => "ok"]);
        default:
            return replyJson(["status" => "ko", "message" => "action '$action' doesn't exist"]);
    }
}

handleRequest();