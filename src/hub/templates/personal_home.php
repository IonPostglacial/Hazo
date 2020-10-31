<?php
$personalFiles = glob(getClientPersonalDirectory() . "/*");
$pdo = getDataDbHandle();
$sharingsByFilePath = getShareLinksByFilePaths($pdo, $personalFiles);
?>

<section class="medium-padding">
    <style>
        .file-list-item[data-state="shared"] .share-block {
            display: none;
        }
        .file-list-item[data-state="unshared"] .unshare-block {
            display: none;
        }
    </style>
    <script>
        window.addEventListener("load", function () {
            let shareButtons = document.getElementsByClassName("btn-share"),
                unshareButtons = document.getElementsByClassName("btn-unshare");
            for (const button of shareButtons) {
                button.addEventListener("click", async function () {
                    const fileToShare = button.dataset.file;
                    const res = await fetch("api/share-file.php", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                        body: `file=${encodeURI(fileToShare)}&method=share`,
                    });
                    const json = JSON.parse(await res.text());
                    console.log(json);
                    const fileListItem = document.querySelector(`.file-list-item[data-file="${fileToShare}"]`);
                    fileListItem.dataset.state = "shared";
                    const downloadLink = fileListItem.querySelector(".unshare-block a");
                    downloadLink.href = `shared?linkid=${json.linkid}`;
                });
            };
            for (const button of unshareButtons) {
                button.addEventListener("click", async function () {
                    const fileToShare = encodeURI(button.dataset.file);
                    const res = await fetch("api/share-file.php", {
                        method: "POST",
                        body: `file=${fileToShare}&method=unshare`,
                    });
                    console.log(res);
                    const fileListItem = document.querySelector(`.file-list-item[data-file="${fileToShare}"]`);
                    fileListItem.dataset.state = "unshared";
                });
            };
        });
    </script>
    <h1>Home of <?php echo getClientIdentity(); ?></h1>
    <a href="index.html">Go to Bunga</a>
    <h2>Your list of databases</h2>
    <form method="POST">
    <ul>
        <?php foreach($personalFiles as $fileName): ?>
            <li class="file-list-item"
                    data-file="<?= htmlspecialchars(basename($fileName)) ?>"
                    data-state="<?= isset($sharingsByFilePath[$fileName]) ? "shared" : "unshared" ?>">
                <a href="private.php?file=<?= htmlspecialchars(basename($fileName)) ?>"><?= htmlspecialchars(basename($fileName)) ?></a>
                <button type="button">Open in Bunga</button>
                <div class="unshare-block inline-block">
                    <button type="button" class="btn-unshare" data-file="<?= htmlspecialchars(basename($fileName)) ?>">
                        Unshare
                    </button>
                    <a download href="shared.php?linkid=<?= htmlspecialchars(isset($sharingsByFilePath[$fileName]) ? $sharingsByFilePath[$fileName] : "") ?>">link for sharing</a>
                </div>
                <div class="share-block inline-block">
                    <button type="button" class="btn-share" data-file="<?= htmlspecialchars(basename($fileName)) ?>">
                        Share
                    </button>
                </div>
            </li>
        <?php endforeach; ?>
    </ul>
    </form>
    <h2>Upload a new database</h2>
    <form method="POST" enctype="multipart/form-data" class="form-grid">
        <label>Database file</label><input type="file" name="db-file-upload" id="db-file-upload">
        <button type="submit" class="background-color-1">Upload</button>
    </form>
    <?php handleForm(); ?>
</section>

<?php
define("MAX_DATASET_SIZE", 5000000);

function getShareLinksByFilePaths(PDO $pdo, array $files): array {
    $shareLinksByFilePaths = [];
    $in  = str_repeat('?,', count($files) - 1) . '?';
    $statement = $pdo->prepare("SELECT shareLink, filePath FROM FileSharing WHERE filePath IN ($in)");
    $statement->execute($files);
    while ($row = $statement->fetch()) {
        $shareLinksByFilePaths[$row["filePath"]] = $row["shareLink"];
    }
    return $shareLinksByFilePaths;
}

function isFormValid(): bool {
    return !empty($_FILES) && !empty($_FILES["db-file-upload"]) && $_FILES["db-file-upload"]["type"] == "application/json";
}

function isJson(string $string): bool {
    json_decode($string);
    return (json_last_error() == JSON_ERROR_NONE);
}

function handleForm(): void {
    if (isFormValid()) {
        $target_dir = getClientPersonalDirectory() . "/";
        $uploadedFile = $_FILES["db-file-upload"];
        $target_file = $target_dir . basename($uploadedFile["name"]);
        
        if (file_exists($target_file)) {
            echo "file already exists.";
            return;
        }
        if ($uploadedFile["size"] > MAX_DATASET_SIZE) {
            echo "file too big";
            return;
        }
        
        $content = file_get_contents($uploadedFile["tmp_name"]);
        
        if (!isJson($content)) {
            echo "file should contain valid JSON";
            return;
        }
        
        $formatedFileName = htmlspecialchars(basename($uploadedFile["name"]));

        if (move_uploaded_file($uploadedFile["tmp_name"], $target_file)) {
            echo "file '". $formatedFileName . "' has been uploaded.";
        } else {
            echo "file '". $formatedFileName . "' could not be uploaded.";
        }
    } else {
        echo "please enter a db file in the Bunga format<br>";    
    }
}