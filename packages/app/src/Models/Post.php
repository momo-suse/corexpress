<?php

declare(strict_types=1);

namespace Corexpress\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    protected $table = 'posts';
    protected $fillable = ['user_id', 'title', 'slug', 'content', 'excerpt', 'tags', 'featured_image_id', 'map_embed_url', 'status'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function featuredImage(): BelongsTo
    {
        return $this->belongsTo(Image::class , 'featured_image_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(Image::class);
    }

    /** Scope: only published posts */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }
}