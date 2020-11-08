<?php

abstract class FormHandler {
    const GET = 0;
    const POST = 1;

    private $hasErrors = false;

    protected abstract function validate(int $method, array $arguments): array;
    protected abstract function onSubmit(int $method, array $arguments): void;
    protected abstract function onError(int $method): void;

    function isValid(): bool {
        return !$this->hasErrors;
    }

    function invalidate(): void {
        $this->hasErrors = true;
    }

    function execute(): void {
        if ($_SERVER["REQUEST_METHOD"] === "POST") {
            $method = FormHandler::POST;
        } else {
            $method = FormHandler::GET;
        }
        $arguments = $this->validate($method, $_POST);
        if ($this->hasErrors) {
            $this->onError($method);
        } else {
            $this->onSubmit($method, $arguments);
        }
    }
}