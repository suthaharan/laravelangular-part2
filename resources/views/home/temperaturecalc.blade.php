@extends('layouts.inner')

@section('content-header')
        Temperature Conversion
@endsection


@section('content')


    <div ng-controller="TemperatureController as tc">
						<div class="modal-body">
							<form class="form-horizontal" name="myform" data-ng-submit="addConversion()">
				            <fieldset>
				            <!-- Form Name -->
				            <legend>Entry Form</legend>
				            <div class="form-group">
									<label class="col-md-4 control-label" for="temperature">Convert:</label>
									<div class="col-md-4">
									<div class="radio">
										<label>
											<input type="radio" ng-model="$parent.factor" name="factor" id="fahrenheit" ng-value="'F'" value="'F'" required>Fahrenheit to Celsius
										</label>
									</div>
									<div class="radio">
										<label>
											<input type="radio" ng-model="$parent.factor" name="factor" id="celcius" ng-value="'C'" value="'C'" required>Celsius to Fahrenheit
										</label>
									</div>
									</div>
								</div>
				            <!-- Text input-->
				            <div class="form-group">
				              <label class="col-md-4 control-label" for="temperature">Temperature (Celsius/Fahrenheit):</label>  
				              <div class="col-md-4">
				              <input type="number" class="form-control" placeholder="0" ng-model="temp" name="temperature" required> 
				              </div>
				            </div>
				            <div class="form-group">
				              <label class="col-md-4 control-label">Converted temperature:</label>  
				              <div class="col-md-4">
				              <input type="text" class="form-control" ng-model="convertedtemp" name="convertedtemperature"> 
				              </div>
				            </div>
				            <div class="form-group">
								<div class="col-md-4 col-md-push-4 btn-toolbar">
									<input type="submit" class="btn btn-primary" value="Add Conversion" ng-disabled="myform.factor.$invalid || myform.temp.$invalid">
								</div>
				            </div> 		                      
				            </fieldset>
				            </form>
			            
							<div class="row">
								<div class="col-md-12">
									<table class="table table-striped">
										<tr>
											<td>Factor</td>
											<td>Fahrenheit</td></td>
											<td>Celcius</td>
											<td>Action</td>
										</tr>				
										<tr ng-repeat='tempstore in tempstores'>
											<td><% tempstore.factor %></td>
											<td><% tempstore.fahrenheit %></td>
											<td><% tempstore.celcius %></td>
											<td><button class="btn btn-danger btn-xs" ng-click="deleteTempstore($index)">  <span class="glyphicon glyphicon-trash" ></span></button></td>
										</tr>
									</table>
								</div>
							</div>
	
	
				            
				            
				            
				            
				            
				            
						</div> <!-- /.modal-body -->
	</div>			
				
				



@endsection