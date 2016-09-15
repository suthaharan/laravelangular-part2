<?php

namespace App;
use Illuminate\Database\Eloquent\Model;
use DB;

class Tempstore extends Model
{
   public $table = "tempstore";
   protected $fillable = array('factor', 'celcius', 'fahrenheit', 'convertedval');

}
