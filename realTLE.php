<?php
    $url = 'http://www.celestrak.com/NORAD/elements/'.$_GET['system'].".txt";
    $htm = file_get_contents($url);
	if($_GET['one']==true){
		$splitlines = explode("\n",$htm);
		echo $splitlines[0]."\n".$splitlines[1]."\n".$splitlines[2];
	}
	else
		echo  str_replace("\n", "\n", $htm);
?>