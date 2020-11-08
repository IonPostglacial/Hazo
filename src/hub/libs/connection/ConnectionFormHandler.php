<?php
require_once("libs/common/FormHandler.php");
require_once("libs/common/Credentials.php");

class ConnectionFormHandler extends FormHandler {
    private $isValidPassword = false;
    private $client;

    function __construct(Client $client) {
        $this->client = $client;
    }

    function isPasswordWrong() {
        return !$this->isValidPassword;
    }

    protected function validate(int $method, array $arguments): array {
        if (!empty($_POST) && !empty($_POST["connection-login"]) && !empty($_POST["connection-password"])) {
            return ["credentials" => new Credentials($_POST["connection-login"], $_POST["connection-password"])];
        } else {
            $this->invalidate();
            return [];
        }
    }

    protected function onSubmit(int $method, array $arguments): void {
        $pdo = getAccountsDbHandle();
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
        $credentials = $arguments["credentials"];
        $this->isValidPassword = $credentials->isValid($pdo);
            
        if ($this->isValidPassword) {
            $this->client->authenticate($credentials->login);
        }
    }

    protected function onError(int $method): void {}
}