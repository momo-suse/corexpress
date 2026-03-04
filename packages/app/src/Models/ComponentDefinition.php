<?php

declare(strict_types=1);

namespace Corexpress\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ComponentDefinition extends Model
{
    // component_definitions has no updated_at column
    public const UPDATED_AT = null;

    protected $table    = 'component_definitions';
    protected $fillable = ['name', 'label', 'type', 'parent_id', 'has_own_page'];

    protected $casts = [
        'parent_id'    => 'integer',
        'has_own_page' => 'boolean',
    ];

    public function styles(): HasMany
    {
        return $this->hasMany(ComponentStyle::class, 'component_definition_id');
    }

    /** Sub-components that belong to this component. */
    public function subComponents(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }
}
