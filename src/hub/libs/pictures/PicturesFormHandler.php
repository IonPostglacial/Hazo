<?php
require_once("libs/common/FormHandler.php");

class PicturesFormHandler extends FormHandler {
    private $client;

    function __construct(Client $client) {
        $this->client = $client;
    }

    private function isFileSmallerThanLimit(array $fileInfo): bool {
        return filesize($fileInfo["tmp_name"]) < 50000000;
    }

    private function escapeDirectoryName(string $name): string {
        $name = mb_ereg_replace("([^\w\s\d\-_~,;\[\]\(\).])", '', $name);
        $name = mb_ereg_replace("([\.]{2,})", '', $name);
        return $name;
    }

    protected function validate(int $method, array $args): array {
        $zipMimeTypes = ["application/zip", "application/x-zip-compressed", "multipart/x-zip"];
        $fileNotEmpty = !empty($_FILES) && !empty($_FILES["pictures-file-upload"]);

        if($fileNotEmpty && in_array($_FILES["pictures-file-upload"]["type"], $zipMimeTypes) && $this->isFileSmallerThanLimit($_FILES["pictures-file-upload"])) {
            return ["uploadedFile" => $_FILES["pictures-file-upload"]];
        } else {
            $this->invalidate();
            return [];
        }
    }

    protected function onSubmit(int $method, array $args): void {
        $uploadedFile = $args["uploadedFile"];
        $uploadedFileFullName = $uploadedFile["tmp_name"];
        $uploadedFileName = pathinfo($uploadedFile["name"], PATHINFO_FILENAME);
        $targetDir = $this->client->getPersonalDirectory() . "/pictures/" . $this->escapeDirectoryName($uploadedFileName);

        $zip = new ZipArchive;
        $res = $zip->open($uploadedFileFullName);
        if ($res === TRUE) {
            $zip->extractTo($targetDir . "/");
            $zip->close();
            echo "success";
        } else {
            echo "failure";
        }
    }

    protected function onError(int $method): void {
        echo "You should select a zip file smaller than 50 Mo.";
    }
}