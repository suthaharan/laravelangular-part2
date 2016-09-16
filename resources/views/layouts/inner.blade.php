<!DOCTYPE html>
<html ng-app="app">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>{{ env("APP_NAME") }}</title>

    @include('shared.assets_css')

</head>

<body>

	<nav class="navbar navbar-inverse navbar-fixed-top" role="navigation">
		<div class="container-fluid">
			<div class="navbar-header">
				<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#sidebar-collapse">
					<span class="sr-only">Toggle navigation</span>
					<span class="icon-bar"></span>
					<span class="icon-bar"></span>
					<span class="icon-bar"></span>
				</button>
				<a class="navbar-brand" href="#"><span>Laravel</span>Admin</a>
				<ul class="user-menu">
					<li class="dropdown pull-right">
						<a href="#" class="dropdown-toggle" data-toggle="dropdown"><svg class="glyph stroked male-user"><use xlink:href="#stroked-male-user"></use></svg> User <span class="caret"></span></a>
						<ul class="dropdown-menu" role="menu">
							<li><a href="#"><svg class="glyph stroked gear"><use xlink:href="#stroked-gear"></use></svg> Settings</a></li>
							<li><a href="#"><svg class="glyph stroked cancel"><use xlink:href="#stroked-cancel"></use></svg> Logout</a></li>
						</ul>
					</li>
				</ul>
			</div>
							
		</div><!-- /.container-fluid -->
	</nav>
		
	<div id="sidebar-collapse" class="col-sm-3 col-lg-2 sidebar">

		<ul class="nav menu navadjust">
			<li><a href="{{ SiteFuncs::set_active('home') }}"><a href="/home"><svg class="glyph stroked home"><use xlink:href="#stroked-home"></use></svg> Home</a></li>
			<li class="{{ SiteFuncs::set_active('instructions') }}"><a href="/instructions"><svg class="glyph stroked male-user"><use xlink:href="#stroked-male-user"></use></svg> Instructions</a></li>	
			<li role="presentation" class="divider"></li>			
			<li class="{{ SiteFuncs::set_active('temperaturecalc') }}"><a href="/temperaturecalc"><svg class="glyph stroked dashboard-dial"><use xlink:href="#stroked-dashboard-dial"></use></svg> Temperature Calc</a></li>
			<li class="{{ SiteFuncs::set_active('catalogue') }}"><a href="/catalogue"><svg class="glyph stroked table"><use xlink:href="#stroked-table"></use></svg> Stock</a></li>
		</ul>

	</div><!--/.sidebar-->
		
	<div class="col-sm-9 col-sm-offset-3 col-lg-10 col-lg-offset-2 main">			
		<div class="row">
			<ol class="breadcrumb">
				<li><a href="/"><svg class="glyph stroked home"><use xlink:href="#stroked-home"></use></svg></a></li>
				<li class="active">Data</li>
			</ol>
		</div><!--/.row-->
		
		<div class="row">
			<div class="col-lg-12">
				<h3 class="page-header">@yield('content-header')</h3>
			</div>
		</div><!--/.row-->
				
				
				
		<div class="row">
			<div class="col-lg-12">				
				<div class="panel panel-default">				
                        <div id="wrapper">
                            <div id="page-wrapper" class="gray-bg">
                        
                                    @yield('content')
                                
                            </div>
                        </div>
                   </div>
                </div>    
            </div>
        </div>    

@include('shared.assets_js')

</body>
</html>