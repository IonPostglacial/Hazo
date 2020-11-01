<?php

function isConnectionFormValid() {
    return !empty($_POST) && !empty($_POST["connection-login"]) && !empty($_POST["connection-password"]);
}

function getSubmittedCredentials() {
    return new Credentials($_POST["connection-login"], $_POST["connection-password"]);
}

function handleConnectionForm() {
    $pdo = getAccountsDbHandle();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if (isConnectionFormValid()) {
        $credentials = getSubmittedCredentials();
        
        if ($credentials->isValid($pdo)) {
            authenticateClient($credentials->login);
        } else {
            flagClientWrongPassword();
        }
    }
}

handleConnectionForm();