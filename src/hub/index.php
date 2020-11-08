<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Home page</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="centered readable-max-width">
<?php
require_once("libs/common/tools.php");
require_once("libs/common/with_authentication.php");

with_authentication(function (Client $client) {
    home_template($client);
});
?>
</div>
</html>