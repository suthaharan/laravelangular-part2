<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the controller to call when that URI is requested.
|
*/
URL::forceSchema('https');

Route::get('/', 'MainController@index');
Route::get('/home', 'MainController@index');
Route::get('/instructions', 'MainController@instructions');
Route::get('/catalogue', 'MainController@catalogue');
Route::get('/temperaturecalc', 'MainController@temperaturecalc');

Route::resource('api/tempstore','TempstoreController');
Route::resource('api/stock','StockController');