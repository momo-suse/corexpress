<?php

declare(strict_types=1);

namespace Corexpress\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StyleCollection extends Model
{
    protected $table    = 'style_collections';
    protected $fillable = ['name', 'label', 'is_default'];
    protected $casts    = ['is_default' => 'boolean'];

    public function componentStyles(): HasMany
    {
        return $this->hasMany(ComponentStyle::class, 'collection_id');
    }

    /** Scope: only the default (fallback) collection */
    public function scopeDefault(Builder $query): Builder
    {
        return $query->where('is_default', true);
    }
}
