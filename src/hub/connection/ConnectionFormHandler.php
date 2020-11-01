<?php
include_once("common/FormHandler.php");

class ConnectionFormHandler extends FormHandler {
    private $isValidPassword = false;

    function isPasswordWrong() {
        return !$this->isValidPassword;
    }

    protected function validateGet(array $arguments): array {
        $this->invalidate();
        return [];
    }

    protected function validatePost(array $arguments): array {
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
            authenticateClient($credentials->login);
        }
    }

    protected function onError(int $method): void {}
}