<?php

declare(strict_types=1);

namespace Corexpress\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostTranslation extends Model
{
    protected $table = 'post_translations';
    protected $fillable = ['post_id', 'locale', 'title', 'content', 'excerpt'];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
