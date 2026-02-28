<?php

declare(strict_types=1);

namespace Corexpress\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    // Primary key is a string 'key' column, not an auto-increment integer
    protected $table      = 'settings';
    protected $primaryKey = 'key';
    public    $incrementing = false;
    protected $keyType    = 'string';
    protected $fillable   = ['key', 'value'];
}
