<?php

declare(strict_types=1);

namespace Corexpress\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscriber extends Model
{
    protected $table = 'subscribers';

    protected $fillable = [
        'google_id',
        'name',
        'email',
        'avatar_url',
        'unsubscribe_token',
        'subscribed',
    ];

    protected $casts = [
        'subscribed' => 'boolean',
    ];

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }
}
