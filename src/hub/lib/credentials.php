<?php

class Credentials {
    public $login;
    public $password;

    function __construct(string $login, string $password) {
        $this->login = $login;
        $this->password = $password;
    }
}

function createCredentialsTableIfNeeded(PDO $pdo) {
    $sql = <<<SQL
        CREATE TABLE IF NOT EXISTS Credentials (
            login VARCHAR(64) NOT NULL,
            pwdhash VARCHAR(255) NOT NULL,
            PRIMARY KEY (login)
        )
    SQL;
    $pdo->query($sql);
}

function isValidCredentials(PDO $pdo, Credentials $credentials) {
    $statement = $pdo->prepare("SELECT pwdhash FROM Credentials WHERE login = ?");
    $statement->execute([$credentials->login]);
    $savedCredentials = $statement->fetch();
    return $savedCredentials && password_verify($credentials->password, $savedCredentials["pwdhash"]);
}

function insertCredentials(PDO $pdo, Credentials $credentials) {
    $statement = $pdo->prepare("INSERT INTO Credentials (login, pwdhash) VALUES (?, ?)");
    $statement->execute([$credentials->login, password_hash($credentials->password, PASSWORD_DEFAULT)]);
}