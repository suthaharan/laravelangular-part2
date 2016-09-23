<?php

namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use Request;
use App\Stock;

class StockController extends Controller
{


	public function index() {
 
		$stock = Stock::all();
		return $stock;
	}

	/**
	 * Store a newly created resource in storage.
	 *
	 * @return Response
	 */
	public function store()
	{
		$stock = Stock::create(Request::all());
		return $stock;
	}
	
	
	
	/**
	 * Update the specified resource in storage.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function update($id) {
		$stock = Stock::find($id);
		$stock->done = Request::input('done');
		$stock->save();
 
		return $stock;
	}
	
	
    /**
	 * Remove the specified resource from storage.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function destroy($id) {
		Stock::destroy($id);
	}	
	
	
}
