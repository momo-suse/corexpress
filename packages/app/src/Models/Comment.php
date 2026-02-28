<?php

declare(strict_types=1);

namespace Corexpress\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    // The comments table has no updated_at column
    public const UPDATED_AT = null;

    protected $table    = 'comments';
    protected $fillable = ['post_id', 'author_name', 'author_email', 'content', 'status'];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
