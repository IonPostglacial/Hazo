<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pictures</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
<?php
    require_once("libs/common/tools.php");
    require_once("libs/common/with_authentication.php");
    require_once("libs/common/Client.php");
    require_once("libs/pictures/pictures_template.php");
    require_once("libs/pictures/PicturesFormHandler.php");

    with_authentication(function (Client $client) {
        $formHandler = new PicturesFormHandler($client);
        pictures_template($formHandler, $client);
    });
?>
</body>
</html>