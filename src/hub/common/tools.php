<?php
include_once("config.php");

function debugMode(): void {
    ini_set("display_errors", 1);
    ini_set("display_startup_errors", 1);
    error_reporting(E_ALL);
}

if (DEBUG_MODE_ENABLED) {
    debugMode();
}

function isClientConnected(): bool {
    return session_status() != PHP_SESSION_NONE;
}

function connectClient(): void {
    session_start();
}

function ensureClientConnection(): void {
    if (!isClientConnected()) {
        connectClient();
    }
}

function isClientAuthenticated(): bool {
    return isset($_SESSION["Authenticated"]) && $_SESSION["Authenticated"] === true;
}

function authenticateClient(string $clientLogin): void {
    if (!isClientConnected()) {
        connectClient();
    }
    $_SESSION["Authenticated"] = true;
    $_SESSION["Identity"] = $clientLogin;
}

function getClientIdentity(): string {
    if (isClientAuthenticated()) {
        if (isset($_SESSION["Identity"])) {
            return $_SESSION["Identity"];
        } else {
            return "Anonymous";
        }
    } else {
        return "Nobody";
    }
}

function getClientPersonalDirectory(): string {
    return PRIVATE_FOLDER. "/" . getClientIdentity();
}

function getClientPersonalFilePath(string $fileName): string {
    return getClientPersonalDirectory() . "/" . $fileName;
}

function getClientPersonalDB(): string {
    return PRIVATE_FOLDER . "/" . getClientIdentity() . "/db.sq3";
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