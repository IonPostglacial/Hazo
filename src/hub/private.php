<?php
require_once("libs/common/tools.php");
require_once("libs/common/Client.php");

function isClientAuthorized(Client $client): bool {
    return $client->isAuthenticated();
}

function isFileExisting(Client $client, string $fileName): bool {
    if (!isset($fileName)) {
        return false;
    }
    return file_exists($client->getPersonalFilePath($fileName));
}

function fileToDownload(Client $client): void {
    $fileName = $_GET["file"];
    
    if (isFileExisting($client, $fileName)) {
        header("Content-type: application/json");
        header('Content-Disposition: attachment; filename="' . $fileName . '"');
        echo file_get_contents($client->getPersonalFilePath($fileName));
    } else {
        echo "file not found";
    }
}

function handleRequest() {
    $client = Client::getCurrent();
    $client->ensureConnection();

    if (!isClientAuthorized($client)) {
        return replyForbidden();
    } else {
        fileToDownload($client);
    }
}

handleRequest();