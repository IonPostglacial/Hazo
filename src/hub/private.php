<?php
include_once("common/tools.php");

ensureClientConnection();

function isClientAuthorized(): bool {
    return isClientAuthenticated();
}

function isFileExisting(string $fileName): bool {
    if (!isset($fileName)) {
        return false;
    }
    return file_exists(getClientPersonalFilePath($fileName));
}

function fileToDownload(): void {
    $fileName = $_GET["file"];
    
    if (isFileExisting($fileName)) {
        header("Content-type: application/json");
        header('Content-Disposition: attachment; filename="' . $fileName . '"');
        echo file_get_contents(getClientPersonalFilePath($fileName));
    } else {
        echo "file not found";
    }
}

function handleRequest() {
    if (!isClientAuthorized()) {
        return replyForbidden();
    } else {
        fileToDownload();
    }
}

handleRequest();