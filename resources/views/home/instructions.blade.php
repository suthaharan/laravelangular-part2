@extends('layouts.main')

@section('content')

<div class="instructions">
    {!! $instructions !!}
</div>

<div ng-controller="RateController as vm">
    Rate these instructions:
    <span
        rating
        ng-model="vm.rate"
        max="10"
        aria-labelledby="default-rating"></span>
</div>

@endsection