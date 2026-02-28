<?php

declare(strict_types=1);

namespace Corexpress\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageComponent extends Model
{
    protected $table    = 'page_components';
    protected $fillable = ['page_id', 'component_definition_id', 'is_visible', 'display_order'];
    protected $casts    = ['is_visible' => 'boolean'];

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    public function componentDefinition(): BelongsTo
    {
        return $this->belongsTo(ComponentDefinition::class, 'component_definition_id');
    }
}
