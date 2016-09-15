<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateTempstoreTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('tempstore', function (Blueprint $table) {
            $table->increments('id');
            $table->string('factor', 150);
			$table->string('celcius', 150);
			$table->string('fahrenheit', 150);
			$table->string('convertedval', 100);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop("tempstore");
     
    }
}

