<?php

class Credentials {
    public $login;
    public $password;

    static function createTableIfNeeded(PDO $pdo) {
        $sql = <<<SQL
            CREATE TABLE IF NOT EXISTS Credentials (
                login VARCHAR(64) NOT NULL,
                pwdhash VARCHAR(255) NOT NULL,
                PRIMARY KEY (login)
            )
        SQL;
        $pdo->query($sql);
    }

    function __construct(string $login, string $password) {
        $this->login = $login;
        $this->password = $password;
    }

    function isValid(PDO $pdo): bool {
        $statement = $pdo->prepare("SELECT pwdhash FROM Credentials WHERE login = ?");
        $statement->execute([$this->login]);
        $savedCredentials = $statement->fetch();
        return $savedCredentials && password_verify($this->password, $savedCredentials["pwdhash"]);
    }

    function insert(PDO $pdo): void {
        $statement = $pdo->prepare("INSERT INTO Credentials (login, pwdhash) VALUES (?, ?)");
        $statement->execute([$this->login, password_hash($this->password, PASSWORD_DEFAULT)]);
    }
}