<?php

namespace App;
use Illuminate\Database\Eloquent\Model;
use DB;

class Stock extends Model
{
    public $table = "stock";
    protected $fillable = array('category', 'itemname', 'itemnumber', 'price', 'description');

}
