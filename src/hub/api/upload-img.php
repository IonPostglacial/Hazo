<?php
require_once("../libs/common/tools.php");
require_once("../libs/common/Client.php");

function handleRequest() {
    $client = Client::getCurrent();
    $client->ensureConnection();
    
    if (!$client->isAuthenticated()) {
        return replyForbidden();
    }
    if (empty($_POST["file"])) {
        return replyJson(["status" => "ko", "message" => "file argument is mandatory"]);
    } else {
        $content = file_get_contents($_POST["file"]);
        if (!$content) {
            return replyJson(["status" => "ko", "message" => "file is too big"]);
        } else {
            $basename = urlencode(basename($_POST["file"]));
            $fileName = $client->getPersonalDirectory() . "/pictures/" . $basename;
            file_put_contents($fileName, $content);
            return replyJson(["status" => "ok", "url" => "private/" . $client->getIdentity() . "/pictures/" . $basename]);
        }
    }
}

handleRequest();