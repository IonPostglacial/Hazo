<?php
include_once("../common/tools.php");
include_once("../common/FileSharing.php");

function handleRequest() {
    ensureClientConnection();
    
    if (empty($_POST["file"])) {
        return replyJson(["status" => "ko", "message" => "file argument is mandatory"]);
    }
    $fileName = $_POST["file"];
    $fileFullName = getClientPersonalFilePath($fileName);
    if (!file_exists($fileFullName)) {
        return replyJson(["status" => "ko", "message" => "file '$fileName' doesn't exist"]);
    }
    ensureClientConnection();
    if (!isClientAuthenticated()) {
        return replyForbidden();
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