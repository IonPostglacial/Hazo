<section class="medium-padding">
    <h1>Connect to your account</h1>
    <form class="form-grid" method="POST">
        <label for="connection-login">Login</label><input type="text" name="connection-login" id="connection-login">
        <label for="connection-password">Password</label><input type="password" name="connection-password" id="connection-password">
        <button type="submit" class="background-color-1">Log In</button>
    </form>
    <?php if (!isConnectionFormValid()): ?>
        <p>
            please enter a login and a password
        </p>
    <?php endif; ?>
    <?php if(getClientWrongPasswordAttempts() > 0): ?>
        <p>wrong password</p>
    <?php endif; ?>
</section>