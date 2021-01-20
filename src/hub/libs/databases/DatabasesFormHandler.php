<?php
include_once("libs/common/FormHandler.php");

class DatabasesFormHandler extends FormHandler {
    private $client;

    function __construct(Client $client) {
        $this->client = $client;
    }

    protected function validate(int $method, array $arguments): array {
        if(!empty($_FILES) && !empty($_FILES["db-file-upload"]) && $_FILES["db-file-upload"]["type"] === "application/json") {
            return ["uploadedFile" => $_FILES["db-file-upload"]];
        } else {
            $this->invalidate();
            return [];
        }
    }

    private function isJson(string $string): bool {
        json_decode($string);
        return (json_last_error() === JSON_ERROR_NONE);
    }

    protected function onSubmit(int $method, array $arguments): void {
        $target_dir = $this->client->getPersonalDirectory();
        $uploadedFile = $arguments["uploadedFile"];
        $target_file = $target_dir . "/" . basename($uploadedFile["name"]);
        
        $content = file_get_contents($uploadedFile["tmp_name"]);
        
        if (!$this->isJson($content)) {
            echo "file should contain valid JSON";
            return;
        }
        
        $formatedFileName = htmlspecialchars(basename($uploadedFile["name"]));

        if (move_uploaded_file($uploadedFile["tmp_name"], $target_file)) {
            echo "file '". $formatedFileName . "' has been uploaded.";
        } else {
            echo "file '". $formatedFileName . "' could not be uploaded.";
        }
    }

    protected function onError(int $method): void {
        echo "please enter a db file in the Hazo format<br>";
    }
}