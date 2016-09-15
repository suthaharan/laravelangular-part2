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
						</div> <!-- /.modal-body -->
	</div>			
				
				



@endsection