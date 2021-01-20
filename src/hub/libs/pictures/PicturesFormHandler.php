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
        $imgMimeTypes = ["image/gif", "image/jpeg", "image/png", "image/svg+xml"];
        $fileNotEmpty = !empty($_FILES) && !empty($_FILES["pictures-file-upload"]);
        $fileMimeType = $fileNotEmpty ? $_FILES["pictures-file-upload"]["type"] : null;
        $fileIsZip = in_array($fileMimeType, $zipMimeTypes);
        $fileIsImg = in_array($fileMimeType, $imgMimeTypes);

        if($fileNotEmpty && ($fileIsZip || $fileIsImg) && $this->isFileSmallerThanLimit($_FILES["pictures-file-upload"])) {
            return ["uploadedFile" => $_FILES["pictures-file-upload"], "isZip" => $fileIsZip];
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

        if ($args["isZip"]) {
            $zip = new ZipArchive;
            $res = $zip->open($uploadedFileFullName);
            if ($res === TRUE) {
                $zip->extractTo($targetDir . "/");
                $zip->close();
                echo "success";
            } else {
                echo "failure";
            }
        } else {
            move_uploaded_file($uploadedFileFullName, $this->client->getPersonalDirectory() . "/pictures/" . $uploadedFile["name"]);
        }
    }

    protected function onError(int $method): void {
        echo "You should select a zip file smaller than 50 Mo.";
    }
}