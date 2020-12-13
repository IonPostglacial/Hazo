<?php

function home_template(Client $client) {
?>
    <section class="medium-padding">
        <h1>Home of <?php echo $client->getIdentity(); ?></h1>
        <a href="../">Hazo</a>
        <a href="databases.php">Databases</a>
        <a href="pictures.php">Pictures</a>
    </section>
<?php
}