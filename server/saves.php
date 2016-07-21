<?php

if(!isset($_REQUEST['data'])){
    die("No data");
}

$filename = "list.json";
$data = $_REQUEST['data'];

if(isset($data)){
    $decoded = json_decode($data);
    print_r($decoded);
    if($decoded){
        $list = json_decode(file_get_contents($filename), true);
        $new = array_merge($list, $decoded);
        file_put_contents($filename, json_encode($new));
        print_r($new);
    }else{
        print("Invalid data");
    }
}



?>