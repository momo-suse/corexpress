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
    protected $fillable = ['name', 'label'];

    public function styles(): HasMany
    {
        return $this->hasMany(ComponentStyle::class, 'component_definition_id');
    }
}
