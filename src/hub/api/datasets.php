<?php
require_once("../libs/common/tools.php");
require_once("../libs/common/FileSharing.php");
require_once("../libs/common/Client.php");

function handlePost(Client $client, string $fileName) {
    $fileFullName = $client->getPersonalFilePath($fileName);
}

function handleDelete(Client $client, string $fileName) {
    $fileFullName = $client->getPersonalFilePath($fileName);
    if (!file_exists($fileFullName)) {
        return replyJson(["status" => "ko", "message" => "file '$fileName' doesn't exist"]);
    }
    $pdo = getDataDbHandle();
    FileSharing::unsharePath($pdo, $fileFullName);
    unlink($fileFullName);
}

function handleRequest() {
    $client = Client::getCurrent();
    $client->ensureConnection();

    if (!$client->isAuthenticated()) {
        return replyForbidden();
    }
    if (isset($_POST["file"])) {
        return handlePost($client, $_POST["file"]);
    }
    if (isset($_GET["file"])) {
        return handleDelete($client, $_GET["file"]);
    }
    return replyJson(["status" => "ko", "message" => "file argument is mandatory"]);
}

handleRequest();