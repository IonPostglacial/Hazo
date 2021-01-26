<?php
require_once("../libs/common/tools.php");
require_once("../libs/common/Client.php");

function uploadFile($client, $content, $basename) {
    $fileName = $client->getPersonalDirectory() . "/pictures/" . $basename;
    file_put_contents($fileName, $content);
    return replyJson(["status" => "ok", "url" => "private/" . $client->getIdentity() . "/pictures/" . $basename]);
}

function handleRequest() {
    $client = Client::getCurrent();
    $client->ensureConnection();
    
    if (!$client->isAuthenticated()) {
        return replyForbidden();
    }
    if (empty($_POST["file-url"])) {
        if (empty($_FILES["file"])) {
            return replyJson(["status" => "ko", "message" => "file argument is mandatory"]);
        } else {
            $content = file_get_contents($_FILES["file"]["tmp_name"]);
            $basename = basename($_FILES["file"]["tmp_name"]);
            return uploadFile($client, $content, $basename);
        }
    } else {
        $content = file_get_contents($_POST["file-url"]);
        if (!$content) {
            return replyJson(["status" => "ko", "message" => "file is too big"]);
        } else {
            $basename = urlencode(basename($_POST["file"]));
            return uploadFile($client, $content, $basename);
        }
    }
}

handleRequest();