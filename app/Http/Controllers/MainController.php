<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests;

use Michelf\MarkdownExtra;
use File;

class MainController extends Controller
{

    public function index()
    {
        return view('home.index');
    }

    public function instructions()
    {
        $mdFileContents = file_get_contents(base_path('docs/instructions_angular.md'));

        $markdown = MarkdownExtra::defaultTransform($mdFileContents);

        return view('home.instructions')->withInstructions($markdown);
    }
}
