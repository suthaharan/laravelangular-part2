<!DOCTYPE html>
<html ng-app="app">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>{{ env("APP_NAME") }}</title>

    @include('shared.assets_css')

</head>

<body>

<div id="wrapper">
    <div id="page-wrapper" class="gray-bg">

        <div ng-controller="MainController as vm" class="wrapper wrapper-content">
            @yield('content')
        </div>
    </div>
</div>


@include('shared.assets_js')

</body>
</html>