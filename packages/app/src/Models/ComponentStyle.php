<?php

declare(strict_types=1);

namespace Corexpress\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComponentStyle extends Model
{
    protected $table    = 'component_styles';
    protected $fillable = ['collection_id', 'component_definition_id', 'styles_config'];

    // Eloquent automatically JSON-encodes/decodes this column
    protected $casts = ['styles_config' => 'array'];

    public function collection(): BelongsTo
    {
        return $this->belongsTo(StyleCollection::class, 'collection_id');
    }

    public function componentDefinition(): BelongsTo
    {
        return $this->belongsTo(ComponentDefinition::class, 'component_definition_id');
    }
}
