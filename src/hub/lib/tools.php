<?php

function debugMode(): void {
    ini_set("display_errors", 1);
    ini_set("display_startup_errors", 1);
    error_reporting(E_ALL);
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

function flagClientWrongPassword(): void {
    if (!isset($_SESSION["WrongPasswordAttempts"])) {
        $_SESSION["WrongPasswordAttempts"] = 0;
    }
    $_SESSION["WrongPasswordAttempts"] += 1;
}

function getClientWrongPasswordAttempts(): int {
    if (isset($_SESSION["WrongPasswordAttempts"])) {
        return $_SESSION["WrongPasswordAttempts"];
    } else {
        return 0;
    }
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
    $root = $_SERVER["DOCUMENT_ROOT"];
    return "$root/Bunga/hub/private/" . getClientIdentity();
}

function getClientPersonalFilePath(string $fileName): string {
    return getClientPersonalDirectory() . "/" . $fileName;
}

function getClientPersonalDB(): string {
    $root = $_SERVER["DOCUMENT_ROOT"];
    return "$root/Bunga/hub/private/" . getClientIdentity() . "/db.sq3";
}

function getAccountsDbHandle(): PDO {
    $root = $_SERVER["DOCUMENT_ROOT"];
    $pdo = new PDO("sqlite:$root/Bunga/hub/private/accounts.sq3");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $pdo;
}

function getDataDbHandle(): PDO {
    $root = $_SERVER["DOCUMENT_ROOT"];
    $pdo = new PDO("sqlite:$root/Bunga/hub/private/data.sq3");
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