<?php

class FileSharing {
    public string $linkId;
    public string $filePath;

    static function createTableIfNeeded(PDO $pdo) {
        $sql = <<<SQL
            CREATE TABLE IF NOT EXISTS FileSharing (
                shareLink VARCHAR(48) NOT NULL,
                filePath TEXT NOT NULL,
                PRIMARY KEY (sharelink)
            )
        SQL;
        $pdo->query($sql);
    }

    function __construct(string $linkId, string $filePath) {
        $this->linkId = $linkId;
        $this->filePath = $filePath;
    }

    function share(PDO $pdo): void {
        $statement = $pdo->prepare("INSERT INTO FileSharing (sharelink, filePath) VALUES (?, ?)");
        $statement->execute([$this->linkId, $this->filePath]);
    }

    static function getFromLinkId(PDO $pdo, string $linkId): FileSharing {
        $statement = $pdo->prepare("SELECT filePath FROM FileSharing WHERE shareLink = ?");
        $statement->execute([$linkId]);
        $filePath = $statement->fetch();
        return new FileSharing($linkId, $filePath["filePath"]);
    }

    static function getLinkIdsForFilePaths(PDO $pdo, array $files): array {
        if (count($files) === 0) {
            return [];  
        }
        $shareLinksByFilePaths = [];
        $in  = str_repeat('?,', count($files) - 1) . '?';
        $statement = $pdo->prepare("SELECT shareLink, filePath FROM FileSharing WHERE filePath IN ($in)");
        $statement->execute($files);
        while ($row = $statement->fetch()) {
            $shareLinksByFilePaths[$row["filePath"]] = $row["shareLink"];
        }
        return $shareLinksByFilePaths;
    }

    static function generate(string $filePath): FileSharing {
        return new FileSharing(bin2hex(random_bytes(48)), $filePath);
    }

    static function unsharePath(PDO $pdo, string $filePath): void {
        $statement = $pdo->prepare("DELETE FROM FileSharing WHERE filePath = ?");
        $statement->execute([$filePath]);
    }
}