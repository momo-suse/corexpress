<?php

declare(strict_types=1);

namespace Corexpress\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Image extends Model
{
    public $timestamps = false;

    protected $table    = 'images';
    protected $fillable = ['post_id', 'filename', 'original_name', 'mime_type', 'file_size'];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
