

# SETUP Configuration 
* Laravel Framework version 5.2.45
* Composer 1.2.1 (stable channel)
* PHP 5.5.9-1ubuntu4.19 (cli) (built: Jul 28 2016 19:31:33) 
* PHP Group Zend Engine v2.5.0
* Node v4.5.0
* NPM 2.15.9
* Bower 1.7.9
* Gulp CLI version 3.9.1


# Laravel Assessment Application

1. Comment the force https statement on routes.php if https is not enabled for the domain
2. Clicking on Help in the current home page shows the text "HINT! - Mention that you found this hint in your code!"
3. A correction related to RateController was fixed inside js/custom/rate.js (angular controller)

Welcome to the CAT Laravel Assessment application. This is designed to give us a sense of your skill set and give you a brief introduction to our workflow and technology stack.

The base application we have provided matches several of the CAT applications we are currently running. In particular, take note of the versions of Angular and related dependencies.

# Installation

1. Clone the repository.
2. `composer install`
3. `npm install`
4. `bower install`
5. `./node_modules/bower-installer/bower-installer.js`

## Additional info

Ubuntu linux was used for the application test


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