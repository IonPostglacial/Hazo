<?php 
require_once("libs/common/Client.php");
Client::getCurrent()->ensureConnection();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Databases</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
<?php
    require_once("libs/common/tools.php");
    require_once("libs/common/with_authentication.php");
    require_once("libs/databases/DatabasesFormHandler.php");
    require_once("libs/databases/databases_template.php");

    with_authentication(function (Client $client) {
        $form = new DatabasesFormHandler($client);
        databases_template($form, $client);
    });
?>    
</body>
</html>