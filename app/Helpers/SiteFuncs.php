<?php

namespace App\Helpers;
use Request;

class SiteFuncs {
    /**
     * Print the First name, Last name of the user
     * SiteFuncs::full_name("John","Doe");
     * @param string $first_name
     * @param string $last_name
     * @return string
     */
    public static function full_name($first_name, $last_name) {
        return $first_name . ', '. $last_name;   
    }
    
    
    /**
     * Set active page in navigation URL
     * SiteFuncs::set_active("home")
     * @param string $uri
     * @return string
     */
    public static function set_active($uri)
    {
        //return 'active';
        return Request::is($uri) ? 'active' : '';
    }

}