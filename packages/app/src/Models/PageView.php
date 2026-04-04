<?php

declare(strict_types=1);

namespace Corexpress\Models;

use Illuminate\Database\Eloquent\Model;

class PageView extends Model
{
    protected $table = 'page_views';
    public $timestamps = false;
    protected $fillable = ['page_slug', 'ip_hash', 'date_key'];
}
