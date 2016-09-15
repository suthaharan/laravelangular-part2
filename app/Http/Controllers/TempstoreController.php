<?php

namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Tempstore;
use Request;
class TempstoreController extends Controller
{

	/**
	 * Send back all comments as JSON
	 *
	 * @return Response
	 */
	/*public function index()
	{
		return Response::json(Tempstore::get());
	}*/
	public function index() {
 
		$tempstore = Tempstore::all();
		return $tempstore;
	}
	/**
	 * Store a newly created resource in storage.
	 *
	 * @return Response
	 */
	public function store()
	{
		$tempstore = Tempstore::create(Request::all());
		return $tempstore;
	}
	
    /**
	 * Remove the specified resource from storage.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function destroy($id) {
		Tempstore::destroy($id);
	}	
}
