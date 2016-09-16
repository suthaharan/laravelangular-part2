

# SETUP Configuration 
* Laravel Framework version 5.2.45
* Composer 1.2.1 (stable channel)
* PHP 5.5.9-1ubuntu4.19 (cli) (built: Jul 28 2016 19:31:33) 
* PHP Group Zend Engine v2.5.0
* Node v4.5.0
* NPM 2.15.9
* Bower 1.7.9
* Gulp CLI version 3.9.1
_Ubuntu linux was used for the application test_

# Laravel Assessment Application

1. Comment the force https statement on routes.php if https is not enabled for the domain
2. Clicking on Help in the current home page shows the text "HINT! - Mention that you found this hint in your code!"
3. A correction related to RateController was fixed inside js/custom/rate.js (angular controller)
4. Nested controller in blade layout template was removed
5. Helper class added to manage active links in the left navigation
6. Filter function in AngularJS written to handle the temperature conversion formula

# Installation

1. Clone the repository.
2. `composer install`
3. `npm install`
4. `bower install`
5. `./node_modules/bower-installer/bower-installer.js`

## Temperature Conversion

```
Angular Controllers are organized under \resources\assets\js\custom\controllers

For temperature conversion a filter is used. The filter takes in two arguments:

factor: 'F' or 'C' to indiate if the conversion is from Fahrenheit to Celcius or Celcius to Fahrenheit
indicator: to append degree symbol if it is Celcius

```

## Creation of CRUD 

```
$ php artisan make:migration create_stock_table --table=stock
$ php artisan make:migration create_tempstore_table --table=tempstore
$ php artisan migrate
$ php artisan make:model tempstore
$ php artisan make:model stock
$ php artisan make:controller TempstoreController 
$ php artisan make:controller StockController 
$ php artisan route:list
```

###### Routes - Temperature Conversion, Catalogue Stock Items 

```
+--------+-----------+--------------------------------+-----------------------+-----------------------------------------------------+------------+
| Domain | Method    | URI                            | Name                  | Action                                              | Middleware |
+--------+-----------+--------------------------------+-----------------------+-----------------------------------------------------+------------+
|        | GET|HEAD  | /                              |                       | App\Http\Controllers\MainController@index           | web        |
|        | POST      | api/stock*                     | api.stock.store       | App\Http\Controllers\StockController@store          | web        |
|        | GET|HEAD  | api/stock                      | api.stock.index       | App\Http\Controllers\StockController@index          | web        |
|        | GET|HEAD  | api/stock/create*              | api.stock.create      | App\Http\Controllers\StockController@create         | web        |
|        | GET|HEAD  | api/stock/{stock}              | api.stock.show        | App\Http\Controllers\StockController@show           | web        |
|        | PUT|PATCH | api/stock/{stock}              | api.stock.update      | App\Http\Controllers\StockController@update         | web        |
|        | DELETE    | api/stock/{stock}*             | api.stock.destroy     | App\Http\Controllers\StockController@destroy        | web        |
|        | GET|HEAD  | api/stock/{stock}/edit         | api.stock.edit        | App\Http\Controllers\StockController@edit           | web        |
|        | POST      | api/tempstore*                 | api.tempstore.store   | App\Http\Controllers\TempstoreController@store      | web        |
|        | GET|HEAD  | api/tempstore                  | api.tempstore.index   | App\Http\Controllers\TempstoreController@index      | web        |
|        | GET|HEAD  | api/tempstore/create*          | api.tempstore.create  | App\Http\Controllers\TempstoreController@create     | web        |
|        | GET|HEAD  | api/tempstore/{tempstore}      | api.tempstore.show    | App\Http\Controllers\TempstoreController@show       | web        |
|        | DELETE    | api/tempstore/{tempstore}*     | api.tempstore.destroy | App\Http\Controllers\TempstoreController@destroy    | web        |
|        | PUT|PATCH | api/tempstore/{tempstore}      | api.tempstore.update  | App\Http\Controllers\TempstoreController@update     | web        |
|        | GET|HEAD  | api/tempstore/{tempstore}/edit | api.tempstore.edit    | App\Http\Controllers\TempstoreController@edit       | web        |
|        | GET|HEAD  | catalogue                      |                       | App\Http\Controllers\MainController@catalogue       | web        |
|        | GET|HEAD  | home                           |                       | App\Http\Controllers\MainController@index           | web        |
|        | GET|HEAD  | instructions                   |                       | App\Http\Controllers\MainController@instructions    | web        |
|        | GET|HEAD  | temperaturecalc                |                       | App\Http\Controllers\MainController@temperaturecalc | web        |
+--------+-----------+--------------------------------+-----------------------+-----------------------------------------------------+------------+

* - API's marked with * are only available at this time

```