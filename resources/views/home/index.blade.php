@extends('layouts.inner')

@section('content-header')
        Exercise
@endsection


@section('content')
<div ng-controller="MainController as vm" class="wrapper wrapper-content">
    <h1>Laravel Assessment Exercise!</h1>
    
    <p>
        Welcome to the Laravel Assessment Exercise. We're glad to have you here!
    </p>
    
    <p>
        Please follow any instructions in the readme.md file in the root of this repository.
    </p>
    
    <h2>We're here to <span ng-click="vm.hint()">help!</span></h2>
    
    <p>
        If you have any questions about the assignment, please reach out to your recruitment contact.
    </p>
    
    <p ng-cloak ng-if="vm.showHint">
        <% vm.aHint %>
    </p>
</div>
@endsection