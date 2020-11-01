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
include_once("lib/tools.php");
include_once("lib/Credentials.php");
include_once("lib/FileSharing.php");

ensureClientConnection();

include("templates/connection_form_handler.php");

if (!isClientAuthenticated()) {
    include("templates/connection_form.php");
} else {
    include("templates/personal_home.php");
}
?>
</div>
</html>