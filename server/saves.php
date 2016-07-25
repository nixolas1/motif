<?php

if(!isset($_REQUEST['data'])){
    die("No data");
}

$filename = "list.json";
$data = $_REQUEST['data'];

if(isset($data)){
    $decoded = json_decode($data);
    if($decoded){
        $list = json_decode(file_get_contents($filename), true);
        array_push($list, $decoded);
        file_put_contents($filename, json_encode($list));
        print("yes");
    }else{
        print("Invalid data");
    }
}



?>