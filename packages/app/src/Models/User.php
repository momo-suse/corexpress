<?php

declare(strict_types=1);

namespace Corexpress\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    protected $table    = 'users';
    protected $fillable = ['email', 'password_hash', 'reset_token_hash', 'reset_token_expires'];
    protected $hidden   = ['password_hash', 'reset_token_hash'];

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}
