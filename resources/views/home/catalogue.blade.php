@extends('layouts.inner')

@section('content-header')
        Catalogue Stocks
@endsection


@section('content')


    <div ng-controller="StockController as sc">
						<div class="modal-body">
							<form class="form-horizontal" name="mystockform" data-ng-submit="addStock()">
				            <fieldset>
				            <!-- Form Name -->
				            <legend>Manage Catalogue</legend>
				            <!-- Text input-->
				            <div class="form-group">
				              <label class="col-md-4 control-label" for="itemcategory">Category</label>  
				              <div class="col-md-4">
				              <input type="text" class="form-control" placeholder="Category" ng-model="icategory" name="itemcategory" required> 
				              </div>
				            </div>
				            <div class="form-group">
				              <label class="col-md-4 control-label" for="itemname">Item Name</label>  
				              <div class="col-md-4">
				              <input type="text" class="form-control" placeholder="Item Name" ng-model="iname" name="itemname" required> 
				              </div>
				            </div>
				            <div class="form-group">
				              <label class="col-md-4 control-label" for="itemnumber">Item Number</label>  
				              <div class="col-md-4">
				              <input type="number" class="form-control" placeholder="0" ng-model="inumber" name="itemnumber" required> 
				              </div>
				            </div>
				            <div class="form-group">
				              <label class="col-md-4 control-label" for="itemprice">Price</label>  
				              <div class="col-md-4">
				              <input type="number" class="form-control" placeholder="0" ng-model="iprice" name="itemprice" required> 
				              </div>
				            </div>	
				            <div class="form-group">
				              <label class="col-md-4 control-label" for="itemdescription">Description</label>  
				              <div class="col-md-4">
				              <input type="text" class="form-control" placeholder="Description" ng-model="idescription" name="itemdescription" required> 
				              </div>
				            </div>				            
				            <div class="form-group">
								<div class="col-md-4 col-md-push-4 btn-toolbar">
									<input type="submit" class="btn btn-primary" value="Add Item">
								</div>
				            </div> 		                      
				            </fieldset>
				            </form>
				            <div class="row">
								<div class="col-md-12">
									<div class="panel panel-default">
										<div class="panel-heading">Catalogue List</div>
										<div class="panel-body">
											<table class="table table-striped">
												<tr>
													<td>Category</td>
													<td>Item Name</td></td>
													<td>Item Number</td>
													<td>Price</td>
													<td>Comments</td>
													<td>Action</td>
												</tr>				
												<tr ng-repeat='stock in stocks'>
													<td><% stock.category %></td>
													<td><% stock.itemname %></td>
													<td><% stock.itemnumber %></td>
													<td><% stock.price %></td>
													<td><% stock.description %></td>
													<td><button class="btn btn-danger btn-xs" ng-click="deleteStock($index)">  <span class="glyphicon glyphicon-trash" ></span></button></td>
												</tr>
											</table>
										</div>
									</div>
								</div>
							</div>
						</div> <!-- /.modal-body -->
					</div>			
				
				


    
@endsection