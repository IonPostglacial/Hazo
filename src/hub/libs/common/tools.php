<?php
require_once("config.php");

function debugMode(): void {
    ini_set("display_errors", 1);
    ini_set("display_startup_errors", 1);
    error_reporting(E_ALL);
}

if (DEBUG_MODE_ENABLED) {
    debugMode();
}

function getAccountsDbHandle(): PDO {
    $pdo = new PDO("sqlite:" . PRIVATE_FOLDER . "/accounts.sq3");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $pdo;
}

function getDataDbHandle(): PDO {
    $pdo = new PDO("sqlite:" . PRIVATE_FOLDER . "/data.sq3");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $pdo;
}

function replyForbidden(): void {
    header("HTTP/1.0 403 Forbidden");
    echo "Access Forbidden";
}

function replyNotFound(): void {
    header("HTTP/1.0 404 Not Found");
    echo "Not found";
}

function replyBadRequest(): void {
    header("HTTP/1.0 400 Bad Request");
    echo "Bad Request";
}

function replyJson(array $arrayToJsonify): void {
    header("Content-type: application/json");
    echo json_encode($arrayToJsonify);
}