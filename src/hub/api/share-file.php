<?php
include_once("../lib/tools.php");

function createFileSharingTableIfNeeded(PDO $pdo) {
    $sql = <<<SQL
        CREATE TABLE IF NOT EXISTS FileSharing (
            shareLink VARCHAR(48) NOT NULL,
            filePath TEXT NOT NULL,
            PRIMARY KEY (sharelink)
        )
    SQL;
    $pdo->query($sql);
}

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

    createFileSharingTableIfNeeded($pdo);

    $shareLinkId = bin2hex(random_bytes(48));
    $action = "share";
    if (!empty($_POST["action"])) {
        $action = $_POST["action"];
    }
    switch ($action) {
        case "share":
            $statement = $pdo->prepare("INSERT INTO FileSharing (sharelink, filePath) VALUES (?, ?)");
            $statement->execute([$shareLinkId, $fileFullName]);
            return replyJson(["status" => "ok", "linkid" => $shareLinkId]);
        case "unshare":
            $statement = $pdo->prepare("DELETE FROM FileSharing WHERE filePath = ?");
            $statement->execute([$fileFullName]);
            return replyJson(["status" => "ok"]);
        default:
            return replyJson(["status" => "ko", "message" => "action '$action' doesn't exist"]);
    }
}

handleRequest();