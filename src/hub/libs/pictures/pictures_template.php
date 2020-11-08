<?php function pictures_template(PicturesFormHandler $form, Client $client) { ?>
    <nav>
        <a href="./">Back to home</a>
    </nav>
    <h2>Pictures Library</h2>
    <a href="<?php echo $client->getPictureLibraryUrl(); ?>">Navigate Picture Library</a>
    <h2>Upload a new pictures folder</h2>
        <form method="POST" enctype="multipart/form-data" class="form-grid">
            <label>Pictures zip</label><input type="file" accept=".zip" name="pictures-file-upload" id="pictures-file-upload">
            <button type="submit" class="background-color-1">Upload</button>
        </form>
        <?php $form->execute(); ?>
<?php } ?>