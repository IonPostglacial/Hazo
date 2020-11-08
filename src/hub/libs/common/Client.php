<?php

class Client {
    private static $client = null;

    private function __construct() {}

    static function getCurrent() {
        if (self::$client === null) {
            self::$client = new Client();
        }
        return self::$client;
    }

    function connect() {
        session_start();
    }

    function isConnected() {
        return session_status() != PHP_SESSION_NONE;
    }

    function ensureConnection(): void {
        if (!$this->isConnected()) {
            $this->connect();
        }
    }

    function authenticate(string $clientLogin): void {
        if (!$this->isConnected()) {
            $this->connect();
        }
        $_SESSION["Authenticated"] = true;
        $_SESSION["Identity"] = $clientLogin;
    }

    function isAuthenticated(): bool {
        return isset($_SESSION["Authenticated"]) && $_SESSION["Authenticated"] === true;
    }

    function getIdentity(): string {
        if ($this->isAuthenticated()) {
            if (isset($_SESSION["Identity"])) {
                return $_SESSION["Identity"];
            } else {
                return "Anonymous";
            }
        } else {
            return "Nobody";
        }
    }

    function getPersonalDirectory(): string {
        return PRIVATE_FOLDER. "/" . $this->getIdentity();
    }

    function getPictureLibraryUrl(): string {
        return "private/" . $this->getIdentity() . "/pictures";
    }
    
    function getPersonalFilePath(string $fileName): string {
        return $this->getPersonalDirectory() . "/" . $fileName;
    }
    
    function getPersonalDB(): string {
        return PRIVATE_FOLDER . "/" . $this->getIdentity() . "/db.sq3";
    }
}