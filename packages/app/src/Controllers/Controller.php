<?php

declare(strict_types=1);

namespace Corexpress\Controllers;

use Psr\Http\Message\ResponseInterface;
use Slim\Psr7\Factory\ResponseFactory;

abstract class Controller
{
    protected ResponseFactory $responseFactory;

    public function __construct()
    {
        $this->responseFactory = new ResponseFactory();
    }

    /**
     * Write JSON data to the response with the given status code.
     */
    protected function json(ResponseInterface $response, mixed $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(
            json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );

        return $response->withStatus($status);
    }

    /**
     * Write a JSON error response.
     */
    protected function error(ResponseInterface $response, string $message, int $status): ResponseInterface
    {
        return $this->json($response, ['error' => $message], $status);
    }
}
