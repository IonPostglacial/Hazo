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
include_once("common/tools.php");
include_once("common/Credentials.php");
include_once("common/FileSharing.php");
include_once("connection/ConnectionFormHandler.php");
include_once("connection/template.php");
include_once("home/HomeFormHandler.php");
include_once("home/template.php");

ensureClientConnection();

$connectionForm = new ConnectionFormHandler();
$connectionForm->execute();

if (!isClientAuthenticated()) {
    connectionForm($connectionForm);
} else {
    personalHome(new HomeFormHandler());
}
?>
</div>
</html>