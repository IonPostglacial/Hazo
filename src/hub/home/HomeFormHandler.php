<?php
include_once("common/FormHandler.php");

class HomeFormHandler extends FormHandler {
    protected function validateGet(array $arguments): array {
        $this->invalidate();
        return [];
    }

    protected function validatePost(array $arguments): array {
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
        $target_dir = getClientPersonalDirectory() . "/";
        $uploadedFile = $arguments["uploadedFile"];
        $target_file = $target_dir . basename($uploadedFile["name"]);
        
        if (file_exists($target_file)) {
            echo "file already exists.";
            return;
        }
        
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
        echo "please enter a db file in the Bunga format<br>";
    }
}