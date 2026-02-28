<?php

declare(strict_types=1);

namespace Corexpress\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Page extends Model
{
    protected $table    = 'pages';
    protected $fillable = ['slug', 'title'];

    public function pageComponents(): HasMany
    {
        return $this->hasMany(PageComponent::class)->orderBy('display_order');
    }
}
