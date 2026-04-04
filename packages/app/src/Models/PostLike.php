<?php

declare(strict_types=1);

namespace Corexpress\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostLike extends Model
{
    protected $table = 'post_likes';
    public $timestamps = false;
    protected $fillable = ['post_id', 'ip_hash'];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
