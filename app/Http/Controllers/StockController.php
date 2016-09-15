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
	
	
}
