<?php
require_once("libs/common/Client.php");
require_once("libs/connection/ConnectionFormHandler.php");
require_once("libs/connection/connection_template.php");
require_once("libs/home/home_template.php");

function with_authentication(callable $displayPageContent) {
    $client = Client::getCurrent();
    $client->ensureConnection();
    
    $connectionForm = new ConnectionFormHandler($client);
    $connectionForm->execute();
    
    if (!$client->isAuthenticated()) {
        connection_template($connectionForm);
    } else {
        $displayPageContent($client);
    }
}