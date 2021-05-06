<?php
	$level = (isset($_GET['level'])) ? $_GET['level'] : 'level0';
?><html lang="en">
	<head>
		<title>Ant Bob - <?=$level ?></title>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
		<link type="text/css" rel="stylesheet" href="main.css">
		<link rel="shortcut icon" type="image/jpg" href="favicon.ico"/>
		<script src="node_modules/three/examples/js/libs/ammo.wasm.js"></script>
	</head>
	<body>
		<div id="container"></div>
		<div id="ui">
			<div id="speedometer" class="dialog fixed hidden">
			</div>
			<div id="inventory" class="dialog inventory fixed hidden">
				<div id="active_item">
					<div id="active_item_portrait">
					</div>
					<div id="active_item_name">
					</div>
					<div id="active_item_text">
					</div>
					<div id="fire_hint" class="hint">
						press <strong>Enter</strong> to fire
					</div>
				</div>
			</div>
			<div id="talk_dialog" class="dialog talk hidden">
				<div id="talk_header">
					<div id="talk_portrait">
					</div>
					<div id="talk_name">
					</div>
				</div>
				<div id="talk_text">
				</div>
				<div id="continue_hint" class="hint">
					press any key to continue
				</div>
			</div>
			<div id="interaction_dialog" class="dialog interaction hidden">
				<div id="interaction_name">
				</div>
				<div id="interact_hint" class="hint hidden">
					press <strong>E</strong> to interact
				</div>
				<div id="talk_hint" class="hint hidden">
					press <strong>E</strong> to talk
				</div>
				<div id="exit_hint" class="hint hidden">
					press <strong>E</strong> to enter
				</div>
				<div id="item_hint" class="hint hidden">
					press <strong>E</strong> to pick up
				</div>
			</div>
		</div>
		<script type="module">

			import * as THREE from './node_modules/three/build/three.module.js';
			window.THREE = THREE; // Used by APP Scripts.

			import UI from './js/ui.js';

			Ammo().then(function (AmmoLib) {
				window.Ammo = Ammo = AmmoLib;
				var ui = new UI('<?=$level ?>');
			});

		</script>
	</body>
</html>
