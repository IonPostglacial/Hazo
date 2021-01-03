<?php
require_once("libs/common/tools.php");
require_once("libs/common/FileSharing.php");

function databases_template(DatabasesFormHandler $form, Client $client) {
    $personalDirectory = $client->getPersonalDirectory();

    if (!file_exists($personalDirectory)) {
        mkdir($personalDirectory);
    }
    $personalFiles = glob("$personalDirectory/*");
    $pdo = getDataDbHandle();
    $sharingsByFilePath = FileSharing::getLinkIdsForFilePaths($pdo, $personalFiles);
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
                        const fileListItem = document.querySelector(`.file-list-item[data-file="${fileToShare}"]`);
                        fileListItem.dataset.state = "shared";
                        const downloadLink = fileListItem.querySelector(".unshare-block a");
                        downloadLink.href = `shared.php?linkid=${json.linkid}`;
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
        <a href="./">Back to home</a>
        <h2>Your list of databases</h2>
        <form method="POST">
        <ul>
            <?php foreach($personalFiles as $fileName): ?>
                <li class="file-list-item"
                        data-file="<?= htmlspecialchars(basename($fileName)) ?>"
                        data-state="<?= isset($sharingsByFilePath[$fileName]) ? "shared" : "unshared" ?>">
                    <a href="private.php?file=<?= htmlspecialchars(basename($fileName)) ?>"><?= htmlspecialchars(basename($fileName)) ?></a>
                    <a class="button" href="../#/?from=<?= urlencode("private.php?file=" . htmlspecialchars(basename($fileName))) ?>">Open in Hazo</a>
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
        <?php $form->execute(); ?>
    </section>
<?php
}