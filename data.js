
"use strict"

var data = {
	spaces: [
	{},
	{
		"id": 1,
		"map": "asia",
		"name": "Kronstadt",
		"x": 525,
		"y": 91,
		"nation": "ah",
		"faction": "cp",
		"terrain": "mountain",
		"vp": 1,
		"area": "balkans",
		"connections": [
			4,
			5,
			8
		],
		"rail_connections": [
			5
		],
		"connection_types": {
			"4": "",
			"5": "rail",
			"8": ""
		}
	},
	{
		"id": 2,
		"map": "asia",
		"name": "Braila",
		"x": 801,
		"y": 104,
		"nation": "ro",
		"faction": "neutral",
		"terrain": "swamp",
		"area": "balkans",
		"connections": [
			3,
			5,
			7,
			13
		],
		"rail_connections": [
			3,
			5
		],
		"connection_types": {
			"3": "rail",
			"5": "rail",
			"7": "",
			"13": ""
		}
	},
	{
		"id": 3,
		"map": "asia",
		"name": "Bolgrad",
		"x": 1004,
		"y": 112,
		"nation": "ru",
		"faction": "ap",
		"area": "balkans",
		"connections": [
			2,
			16
		],
		"rail_connections": [
			2
		],
		"connection_types": {
			"2": "rail",
			"16": "",
			"295": "rail"
		},
		"crossings": {
			"16": "bidirectional"
		},
		"connection_nations": {
			"295": [
				"ru"
			]
		},
		"limited_connections": {
			"ru": [
				2,
				16,
				295
			]
		}
	},
	{
		"id": 4,
		"map": "asia",
		"name": "Hermannstadt",
		"x": 405,
		"y": 127,
		"nation": "ah",
		"faction": "cp",
		"terrain": "mountain",
		"vp": 1,
		"area": "balkans",
		"connections": [
			1,
			18
		],
		"rail_connections": [
			18
		],
		"connection_types": {
			"1": "",
			"18": "rail",
			"296": "rail"
		},
		"connection_nations": {
			"296": [
				"cp"
			]
		},
		"limited_connections": {
			"ah": [
				1,
				18,
				296
			],
			"arm": [
				1,
				18,
				296
			],
			"bu": [
				1,
				18,
				296
			],
			"ge": [
				1,
				18,
				296
			],
			"geo": [
				1,
				18,
				296
			],
			"pe": [
				1,
				18,
				296
			],
			"re": [
				1,
				18,
				296
			],
			"tr": [
				1,
				18,
				296
			],
			"tu": [
				1,
				18,
				296
			],
			"tua": [
				1,
				18,
				296
			]
		}
	},
	{
		"id": 5,
		"map": "asia",
		"name": "Ploesti",
		"x": 673,
		"y": 127,
		"nation": "ro",
		"faction": "neutral",
		"terrain": "mountain",
		"vp": 1,
		"area": "balkans",
		"connections": [
			1,
			2,
			13
		],
		"rail_connections": [
			1,
			2,
			13
		],
		"connection_types": {
			"1": "rail",
			"2": "rail",
			"13": "rail"
		}
	},
	{
		"id": 6,
		"map": "asia",
		"name": "Hatseg",
		"x": 293,
		"y": 143,
		"nation": "ah",
		"faction": "cp",
		"terrain": "mountain",
		"vp": 1,
		"area": "balkans",
		"connections": [
			14
		],
		"rail_connections": [
			14
		],
		"connection_types": {
			"14": "rail",
			"296": "rail"
		},
		"connection_nations": {
			"296": [
				"cp"
			]
		},
		"limited_connections": {
			"ah": [
				14,
				296
			],
			"arm": [
				14,
				296
			],
			"bu": [
				14,
				296
			],
			"ge": [
				14,
				296
			],
			"geo": [
				14,
				296
			],
			"pe": [
				14,
				296
			],
			"re": [
				14,
				296
			],
			"tr": [
				14,
				296
			],
			"tu": [
				14,
				296
			],
			"tua": [
				14,
				296
			]
		}
	},
	{
		"id": 7,
		"map": "asia",
		"name": "Cernavoda",
		"x": 895,
		"y": 173,
		"nation": "ro",
		"faction": "neutral",
		"area": "balkans",
		"connections": [
			2,
			13,
			15,
			16
		],
		"rail_connections": [
			13,
			16
		],
		"connection_types": {
			"2": "",
			"13": "rail",
			"15": "",
			"16": "rail"
		},
		"crossings": {
			"15": "bidirectional",
			"16": "bidirectional"
		}
	},
	{
		"id": 8,
		"map": "asia",
		"name": "Campolung",
		"x": 525,
		"y": 194,
		"nation": "ro",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "balkans",
		"connections": [
			1,
			13
		],
		"rail_connections": [
			13
		],
		"connection_types": {
			"1": "",
			"13": "rail"
		}
	},
	{
		"id": 9,
		"map": "asia",
		"name": "Derbent",
		"x": 3468,
		"y": 199,
		"nation": "ru",
		"faction": "ap",
		"area": "russia",
		"connections": [
			23
		],
		"rail_connections": [
			23
		],
		"connection_types": {
			"23": "rail",
			"297": "rail"
		},
		"connection_nations": {
			"297": [
				"ru"
			]
		},
		"limited_connections": {
			"ru": [
				23,
				297
			]
		}
	},
	{
		"id": 10,
		"map": "asia",
		"name": "Suram",
		"x": 2747,
		"y": 206,
		"nation": "ru",
		"faction": "ap",
		"area": "russia",
		"connections": [
			11,
			12,
			19,
			21
		],
		"rail_connections": [
			12,
			19
		],
		"connection_types": {
			"11": "",
			"12": "rail",
			"19": "rail",
			"21": ""
		}
	},
	{
		"id": 11,
		"map": "asia",
		"name": "Poti",
		"x": 2552,
		"y": 216,
		"nation": "ru",
		"faction": "ap",
		"terrain": "swamp",
		"port": 2,
		"area": "russia",
		"connections": [
			10
		],
		"rail_connections": [],
		"connection_types": {
			"10": ""
		}
	},
	{
		"id": 12,
		"map": "asia",
		"name": "TIFLIS",
		"x": 2931,
		"y": 243,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"vp": 1,
		"area": "russia",
		"connections": [
			10,
			20,
			22
		],
		"rail_connections": [
			10,
			20,
			22
		],
		"connection_types": {
			"10": "rail",
			"20": "rail",
			"22": "rail"
		}
	},
	{
		"id": 13,
		"map": "asia",
		"name": "BUCHAREST",
		"x": 660,
		"y": 250,
		"nation": "ro",
		"faction": "neutral",
		"fort": 1,
		"capital": 1,
		"area": "balkans",
		"connections": [
			2,
			5,
			7,
			8,
			18
		],
		"rail_connections": [
			5,
			7,
			8,
			18
		],
		"connection_types": {
			"2": "",
			"5": "rail",
			"7": "rail",
			"8": "rail",
			"18": "rail"
		}
	},
	{
		"id": 14,
		"map": "asia",
		"name": "Targu Jiu",
		"x": 353,
		"y": 252,
		"nation": "ro",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "balkans",
		"connections": [
			6,
			18
		],
		"rail_connections": [
			6,
			18
		],
		"connection_types": {
			"6": "rail",
			"18": "rail"
		},
		"crossings": {
			"18": "a_to_b"
		}
	},
	{
		"id": 15,
		"map": "asia",
		"name": "Turtukai",
		"x": 823,
		"y": 286,
		"nation": "ro",
		"faction": "neutral",
		"fort": 1,
		"area": "balkans",
		"connections": [
			7,
			16,
			24,
			27
		],
		"rail_connections": [],
		"connection_types": {
			"7": "",
			"16": "",
			"24": "",
			"27": ""
		},
		"crossings": {
			"7": "bidirectional"
		}
	},
	{
		"id": 16,
		"map": "asia",
		"name": "Constanta",
		"x": 1004,
		"y": 269,
		"nation": "ro",
		"faction": "neutral",
		"vp": 1,
		"port": 2,
		"area": "balkans",
		"connections": [
			3,
			7,
			15,
			27
		],
		"rail_connections": [
			7
		],
		"connection_types": {
			"3": "",
			"7": "rail",
			"15": "",
			"27": ""
		},
		"crossings": {
			"3": "bidirectional",
			"7": "bidirectional"
		}
	},
	{
		"id": 17,
		"map": "asia",
		"name": "BELGRADE",
		"x": 128,
		"y": 284,
		"nation": "sb",
		"faction": "neutral",
		"vp": 1,
		"capital": 1,
		"area": "balkans",
		"connections": [
			29,
			41
		],
		"rail_connections": [
			29
		],
		"connection_types": {
			"29": "rail",
			"41": "",
			"296": "rail"
		},
		"connection_nations": {
			"296": [
				"cp"
			]
		},
		"limited_connections": {
			"ah": [
				29,
				41,
				296
			],
			"arm": [
				29,
				41,
				296
			],
			"bu": [
				29,
				41,
				296
			],
			"ge": [
				29,
				41,
				296
			],
			"geo": [
				29,
				41,
				296
			],
			"pe": [
				29,
				41,
				296
			],
			"re": [
				29,
				41,
				296
			],
			"tr": [
				29,
				41,
				296
			],
			"tu": [
				29,
				41,
				296
			],
			"tua": [
				29,
				41,
				296
			]
		}
	},
	{
		"id": 18,
		"map": "asia",
		"name": "Craiova",
		"x": 490,
		"y": 318,
		"nation": "ro",
		"faction": "neutral",
		"area": "balkans",
		"connections": [
			4,
			13,
			14,
			24,
			25,
			31
		],
		"rail_connections": [
			4,
			13,
			14
		],
		"connection_types": {
			"4": "rail",
			"13": "rail",
			"14": "rail",
			"24": "",
			"25": "",
			"31": ""
		},
		"crossings": {
			"24": "bidirectional",
			"25": "bidirectional",
			"31": "bidirectional"
		}
	},
	{
		"id": 19,
		"map": "asia",
		"name": "Batum",
		"x": 2630,
		"y": 319,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"vp": 1,
		"fort": 1,
		"port": 2,
		"area": "russia",
		"connections": [
			10,
			30
		],
		"rail_connections": [
			10
		],
		"connection_types": {
			"10": "rail",
			"30": ""
		}
	},
	{
		"id": 20,
		"map": "asia",
		"name": "Akstafa",
		"x": 3090,
		"y": 321,
		"nation": "ru",
		"faction": "ap",
		"area": "russia",
		"connections": [
			12,
			26
		],
		"rail_connections": [
			12,
			26
		],
		"connection_types": {
			"12": "rail",
			"26": "rail"
		}
	},
	{
		"id": 21,
		"map": "asia",
		"name": "Akhalkaln",
		"x": 2770,
		"y": 324,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"area": "russia",
		"connections": [
			10,
			22,
			30
		],
		"rail_connections": [],
		"connection_types": {
			"10": "",
			"22": "",
			"30": ""
		}
	},
	{
		"id": 22,
		"map": "asia",
		"name": "Aleksandropol",
		"x": 2902,
		"y": 350,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"area": "russia",
		"connections": [
			12,
			21,
			32,
			33
		],
		"rail_connections": [
			12,
			32,
			33
		],
		"connection_types": {
			"12": "rail",
			"21": "",
			"32": "rail",
			"33": "rail"
		}
	},
	{
		"id": 23,
		"map": "asia",
		"name": "Baku",
		"x": 3641,
		"y": 350,
		"nation": "ru",
		"faction": "ap",
		"vp": 1,
		"port": 2,
		"area": "russia",
		"connections": [
			9,
			28,
			40
		],
		"rail_connections": [
			9,
			28
		],
		"connection_types": {
			"9": "rail",
			"28": "rail",
			"40": "",
			"78": "green",
			"283": "green"
		},
		"crossings": {
			"283": "bidirectional"
		},
		"connection_nations": {
			"78": [
				"no_tribe"
			],
			"283": [
				"no_tribe"
			]
		},
		"limited_connections": {
			"anz": [
				9,
				28,
				40,
				78,
				283
			],
			"ar": [
				9,
				28,
				40,
				78,
				283
			],
			"arm": [
				9,
				28,
				40,
				78,
				283
			],
			"br": [
				9,
				28,
				40,
				78,
				283
			],
			"fr": [
				9,
				28,
				40,
				78,
				283
			],
			"gr": [
				9,
				28,
				40,
				78,
				283
			],
			"in": [
				9,
				28,
				40,
				78,
				283
			],
			"it": [
				9,
				28,
				40,
				78,
				283
			],
			"ro": [
				9,
				28,
				40,
				78,
				283
			],
			"ru": [
				9,
				28,
				40,
				78,
				283
			],
			"sb": [
				9,
				28,
				40,
				78,
				283
			],
			"ah": [
				9,
				28,
				40,
				78,
				283
			],
			"bu": [
				9,
				28,
				40,
				78,
				283
			],
			"ge": [
				9,
				28,
				40,
				78,
				283
			],
			"geo": [
				9,
				28,
				40,
				78,
				283
			],
			"pe": [
				9,
				28,
				40,
				78,
				283
			],
			"re": [
				9,
				28,
				40,
				78,
				283
			],
			"tu": [
				9,
				28,
				40,
				78,
				283
			],
			"tua": [
				9,
				28,
				40,
				78,
				283
			]
		}
	},
	{
		"id": 24,
		"map": "asia",
		"name": "Rustchuk",
		"x": 730,
		"y": 368,
		"nation": "bu",
		"faction": "neutral",
		"terrain": "forest",
		"area": "balkans",
		"connections": [
			15,
			18,
			27,
			31
		],
		"rail_connections": [
			27,
			31
		],
		"connection_types": {
			"15": "",
			"18": "",
			"27": "rail",
			"31": "rail"
		},
		"crossings": {
			"18": "bidirectional"
		}
	},
	{
		"id": 25,
		"map": "asia",
		"name": "Vidin",
		"x": 362,
		"y": 381,
		"nation": "bu",
		"faction": "neutral",
		"terrain": "forest",
		"area": "balkans",
		"connections": [
			18,
			29,
			31
		],
		"rail_connections": [],
		"connection_types": {
			"18": "",
			"29": "",
			"31": ""
		},
		"crossings": {
			"18": "bidirectional"
		}
	},
	{
		"id": 26,
		"map": "asia",
		"name": "Evlakh",
		"x": 3279,
		"y": 381,
		"nation": "ru",
		"faction": "ap",
		"area": "russia",
		"connections": [
			20,
			28
		],
		"rail_connections": [
			20,
			28
		],
		"connection_types": {
			"20": "rail",
			"28": "rail"
		}
	},
	{
		"id": 27,
		"map": "asia",
		"name": "Varna",
		"x": 932,
		"y": 410,
		"nation": "bu",
		"faction": "neutral",
		"terrain": "mountain",
		"port": 1,
		"area": "balkans",
		"connections": [
			15,
			16,
			24,
			42
		],
		"rail_connections": [
			24
		],
		"connection_types": {
			"15": "",
			"16": "",
			"24": "rail",
			"42": ""
		}
	},
	{
		"id": 28,
		"map": "asia",
		"name": "Shemakha",
		"x": 3438,
		"y": 417,
		"nation": "ru",
		"faction": "ap",
		"area": "russia",
		"connections": [
			23,
			26,
			40,
			45
		],
		"rail_connections": [
			23,
			26
		],
		"connection_types": {
			"23": "rail",
			"26": "rail",
			"40": "",
			"45": ""
		}
	},
	{
		"id": 29,
		"map": "asia",
		"name": "Nis",
		"x": 222,
		"y": 426,
		"nation": "sb",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "balkans",
		"connections": [
			17,
			25,
			36,
			41
		],
		"rail_connections": [
			17,
			36,
			41
		],
		"connection_types": {
			"17": "rail",
			"25": "",
			"36": "rail",
			"41": "rail"
		}
	},
	{
		"id": 30,
		"map": "asia",
		"name": "Ardahan",
		"x": 2690,
		"y": 434,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"area": "russia",
		"connections": [
			19,
			21,
			33,
			38,
			46
		],
		"rail_connections": [],
		"connection_types": {
			"19": "",
			"21": "",
			"33": "",
			"38": "",
			"46": ""
		}
	},
	{
		"id": 31,
		"map": "asia",
		"name": "Plevna",
		"x": 502,
		"y": 454,
		"nation": "bu",
		"faction": "neutral",
		"fort": 1,
		"area": "balkans",
		"connections": [
			18,
			24,
			25,
			34,
			36
		],
		"rail_connections": [
			24,
			36
		],
		"connection_types": {
			"18": "",
			"24": "rail",
			"25": "",
			"34": "",
			"36": "rail"
		},
		"crossings": {
			"18": "bidirectional",
			"24": "b_to_a"
		}
	},
	{
		"id": 32,
		"map": "asia",
		"name": "Erevan",
		"x": 3013,
		"y": 463,
		"nation": "ru",
		"faction": "ap",
		"vp": 1,
		"area": "russia",
		"connections": [
			22,
			37,
			43
		],
		"rail_connections": [
			22,
			37
		],
		"connection_types": {
			"22": "rail",
			"37": "rail",
			"43": ""
		}
	},
	{
		"id": 33,
		"map": "asia",
		"name": "Kars",
		"x": 2810,
		"y": 473,
		"nation": "ru",
		"faction": "ap",
		"vp": 1,
		"fort": 3,
		"area": "russia",
		"connections": [
			22,
			30,
			43,
			47
		],
		"rail_connections": [
			22,
			47
		],
		"connection_types": {
			"22": "rail",
			"30": "",
			"43": "",
			"47": "rail"
		}
	},
	{
		"id": 34,
		"map": "asia",
		"name": "Tirnova",
		"x": 633,
		"y": 489,
		"nation": "bu",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "balkans",
		"connections": [
			31,
			39
		],
		"rail_connections": [],
		"connection_types": {
			"31": "",
			"39": ""
		}
	},
	{
		"id": 35,
		"map": "asia",
		"name": "Inebolu",
		"x": 1643,
		"y": 507,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"port": 1,
		"area": "anatolia",
		"connections": [
			60
		],
		"rail_connections": [],
		"connection_types": {
			"60": ""
		}
	},
	{
		"id": 36,
		"map": "asia",
		"name": "SOFIA",
		"x": 369,
		"y": 518,
		"nation": "bu",
		"faction": "neutral",
		"terrain": "mountain",
		"vp": 1,
		"capital": 1,
		"area": "balkans",
		"connections": [
			29,
			31,
			49,
			50,
			54
		],
		"rail_connections": [
			29,
			31,
			49
		],
		"connection_types": {
			"29": "rail",
			"31": "rail",
			"49": "rail",
			"50": "",
			"54": ""
		}
	},
	{
		"id": 37,
		"map": "asia",
		"name": "Nachivan",
		"x": 3146,
		"y": 526,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"area": "russia",
		"connections": [
			32,
			55
		],
		"rail_connections": [
			32,
			55
		],
		"connection_types": {
			"32": "rail",
			"55": "rail"
		}
	},
	{
		"id": 38,
		"map": "asia",
		"name": "Rize",
		"x": 2485,
		"y": 528,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"port": 1,
		"area": "caucasus",
		"tribal_activity_grid": "Laz",
		"connections": [
			30,
			44
		],
		"rail_connections": [],
		"connection_types": {
			"30": "",
			"44": ""
		}
	},
	{
		"id": 39,
		"map": "asia",
		"name": "Zagora",
		"x": 768,
		"y": 529,
		"nation": "bu",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "balkans",
		"connections": [
			34,
			42,
			49,
			56
		],
		"rail_connections": [
			42,
			49
		],
		"connection_types": {
			"34": "",
			"42": "rail",
			"49": "rail",
			"56": ""
		}
	},
	{
		"id": 40,
		"map": "asia",
		"name": "Salyani",
		"x": 3588,
		"y": 529,
		"nation": "ru",
		"faction": "ap",
		"area": "russia",
		"connections": [
			23,
			28,
			59
		],
		"rail_connections": [],
		"connection_types": {
			"23": "",
			"28": "",
			"59": ""
		}
	},
	{
		"id": 41,
		"map": "asia",
		"name": "Skopje",
		"x": 122,
		"y": 537,
		"nation": "sb",
		"faction": "neutral",
		"terrain": "mountain",
		"vp": 1,
		"area": "balkans",
		"connections": [
			17,
			29,
			50
		],
		"rail_connections": [
			29,
			50
		],
		"connection_types": {
			"17": "",
			"29": "rail",
			"50": "rail"
		}
	},
	{
		"id": 42,
		"map": "asia",
		"name": "Burgas",
		"x": 919,
		"y": 539,
		"nation": "bu",
		"faction": "neutral",
		"terrain": "forest",
		"port": 1,
		"area": "balkans",
		"connections": [
			27,
			39,
			56
		],
		"rail_connections": [
			39
		],
		"connection_types": {
			"27": "",
			"39": "rail",
			"56": ""
		}
	},
	{
		"id": 43,
		"map": "asia",
		"name": "Kagizman",
		"x": 2919,
		"y": 572,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"area": "russia",
		"tribal_activity_grid": "Kurds",
		"connections": [
			32,
			33,
			47,
			51,
			62
		],
		"rail_connections": [],
		"connection_types": {
			"32": "",
			"33": "",
			"47": "",
			"51": "",
			"62": ""
		}
	},
	{
		"id": 44,
		"map": "asia",
		"name": "Trabzon",
		"x": 2295,
		"y": 562,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"vp": 1,
		"fort": 1,
		"port": 1,
		"area": "caucasus",
		"connections": [
			38,
			48,
			61
		],
		"rail_connections": [],
		"connection_types": {
			"38": "",
			"48": "",
			"61": ""
		}
	},
	{
		"id": 45,
		"map": "asia",
		"name": "Ordubad",
		"x": 3386,
		"y": 562,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"area": "russia",
		"connections": [
			28,
			55
		],
		"rail_connections": [],
		"connection_types": {
			"28": "",
			"55": ""
		}
	},
	{
		"id": 46,
		"map": "asia",
		"name": "Oltu",
		"x": 2596,
		"y": 571,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"area": "russia",
		"connections": [
			30,
			47,
			52,
			58,
			67
		],
		"rail_connections": [],
		"connection_types": {
			"30": "",
			"47": "",
			"52": "",
			"58": "",
			"67": ""
		}
	},
	{
		"id": 47,
		"map": "asia",
		"name": "Sarikamis",
		"x": 2719,
		"y": 576,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"area": "russia",
		"connections": [
			33,
			43,
			46,
			58,
			62
		],
		"rail_connections": [
			33
		],
		"connection_types": {
			"33": "rail",
			"43": "",
			"46": "",
			"58": "",
			"62": ""
		}
	},
	{
		"id": 48,
		"map": "asia",
		"name": "Giresun",
		"x": 2134,
		"y": 590,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"port": 1,
		"area": "anatolia",
		"connections": [
			44,
			61,
			289
		],
		"rail_connections": [],
		"connection_types": {
			"44": "",
			"61": "",
			"289": ""
		}
	},
	{
		"id": 49,
		"map": "asia",
		"name": "Philippopoli",
		"x": 565,
		"y": 603,
		"nation": "bu",
		"faction": "neutral",
		"area": "balkans",
		"connections": [
			36,
			39,
			56,
			75
		],
		"rail_connections": [
			36,
			39,
			56
		],
		"connection_types": {
			"36": "rail",
			"39": "rail",
			"56": "rail",
			"75": ""
		}
	},
	{
		"id": 50,
		"map": "asia",
		"name": "Veles",
		"x": 234,
		"y": 625,
		"nation": "sb",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "balkans",
		"connections": [
			36,
			41,
			70,
			73
		],
		"rail_connections": [
			41,
			73
		],
		"connection_types": {
			"36": "",
			"41": "rail",
			"70": "",
			"73": "rail"
		}
	},
	{
		"id": 51,
		"map": "asia",
		"name": "Bayazit",
		"x": 3055,
		"y": 630,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "caucasus",
		"tribal_activity_grid": "Kurds",
		"connections": [
			43,
			55,
			66,
			72
		],
		"rail_connections": [],
		"connection_types": {
			"43": "",
			"55": "",
			"66": "",
			"72": ""
		}
	},
	{
		"id": 52,
		"map": "asia",
		"name": "Bayburt",
		"x": 2408,
		"y": 632,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "caucasus",
		"connections": [
			46,
			61,
			67
		],
		"rail_connections": [],
		"connection_types": {
			"46": "",
			"61": "",
			"67": ""
		}
	},
	{
		"id": 53,
		"map": "asia",
		"name": "Hazva",
		"x": 1802,
		"y": 633,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			60,
			68
		],
		"rail_connections": [],
		"connection_types": {
			"60": "",
			"68": ""
		}
	},
	{
		"id": 54,
		"map": "asia",
		"name": "Strumica",
		"x": 369,
		"y": 641,
		"nation": "bu",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "balkans",
		"connections": [
			36,
			69,
			73
		],
		"rail_connections": [],
		"connection_types": {
			"36": "",
			"69": "",
			"73": ""
		}
	},
	{
		"id": 55,
		"map": "asia",
		"name": "Julfa",
		"x": 3245,
		"y": 644,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"area": "russia",
		"connections": [
			37,
			45,
			51,
			80
		],
		"rail_connections": [
			37,
			80
		],
		"connection_types": {
			"37": "rail",
			"45": "",
			"51": "",
			"80": "rail"
		}
	},
	{
		"id": 56,
		"map": "asia",
		"name": "Adrianople",
		"x": 755,
		"y": 651,
		"nation": "tu",
		"faction": "cp",
		"vp": 1,
		"fort": 3,
		"area": "balkans",
		"connections": [
			39,
			42,
			49,
			63,
			75
		],
		"rail_connections": [
			49,
			63,
			75
		],
		"connection_types": {
			"39": "",
			"42": "",
			"49": "rail",
			"63": "rail",
			"75": "rail"
		}
	},
	{
		"id": 57,
		"map": "asia",
		"name": "Eregli (Black Sea)",
		"x": 1424,
		"y": 652,
		"nation": "tu",
		"faction": "cp",
		"port": 1,
		"area": "anatolia",
		"connections": [
			76
		],
		"rail_connections": [],
		"connection_types": {
			"76": ""
		}
	},
	{
		"id": 58,
		"map": "asia",
		"name": "Koprukoy",
		"x": 2661,
		"y": 672,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "caucasus",
		"connections": [
			46,
			47,
			62,
			67
		],
		"rail_connections": [],
		"connection_types": {
			"46": "",
			"47": "",
			"62": "",
			"67": ""
		}
	},
	{
		"id": 59,
		"map": "asia",
		"name": "Astara",
		"x": 3594,
		"y": 667,
		"nation": "pe",
		"faction": "neutral",
		"terrain": "forest",
		"area": "persia",
		"connections": [
			40,
			64,
			78
		],
		"rail_connections": [],
		"connection_types": {
			"40": "",
			"64": "",
			"78": ""
		}
	},
	{
		"id": 60,
		"map": "asia",
		"name": "Kastamonu",
		"x": 1654,
		"y": 674,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			35,
			53,
			76
		],
		"rail_connections": [],
		"connection_types": {
			"35": "",
			"53": "",
			"76": ""
		}
	},
	{
		"id": 61,
		"map": "asia",
		"name": "Gumushane",
		"x": 2292,
		"y": 681,
		"nation": "tu",
		"faction": "cp",
		"area": "caucasus",
		"connections": [
			44,
			48,
			52,
			71
		],
		"rail_connections": [],
		"connection_types": {
			"44": "",
			"48": "",
			"52": "",
			"71": ""
		}
	},
	{
		"id": 62,
		"map": "asia",
		"name": "Eleskirt",
		"x": 2813,
		"y": 689,
		"nation": "tu",
		"faction": "cp",
		"area": "caucasus",
		"tribal_activity_grid": "Kurds",
		"connections": [
			43,
			47,
			58,
			77
		],
		"rail_connections": [],
		"connection_types": {
			"43": "",
			"47": "",
			"58": "",
			"77": ""
		}
	},
	{
		"id": 63,
		"map": "asia",
		"name": "Catalca",
		"x": 910,
		"y": 696,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "balkans",
		"connections": [
			56,
			65,
			79
		],
		"rail_connections": [
			56,
			65
		],
		"connection_types": {
			"56": "rail",
			"65": "rail",
			"79": ""
		}
	},
	{
		"id": 64,
		"map": "asia",
		"name": "Ardebil",
		"x": 3438,
		"y": 707,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"area": "azerbaijan",
		"connections": [
			59,
			80,
			83
		],
		"rail_connections": [],
		"connection_types": {
			"59": "",
			"80": "",
			"83": ""
		}
	},
	{
		"id": 65,
		"map": "asia",
		"name": "CONSTANTINOPLE",
		"x": 1061,
		"y": 708,
		"nation": "tu",
		"faction": "cp",
		"vp": 2,
		"capital": 1,
		"area": "balkans",
		"connections": [
			63,
			89,
			287
		],
		"rail_connections": [
			63,
			287
		],
		"connection_types": {
			"63": "rail",
			"89": "strait",
			"287": "rail"
		},
		"connection_straits": {
			"89": 5
		},
		"crossings": {
			"89": "bidirectional"
		},
		"connection_flags": {
			"89": [
				"5"
			]
		}
	},
	{
		"id": 66,
		"map": "asia",
		"name": "Ercis",
		"x": 2925,
		"y": 713,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "caucasus",
		"tribal_activity_grid": "Kurds",
		"connections": [
			51,
			77,
			87
		],
		"rail_connections": [],
		"connection_types": {
			"51": "",
			"77": "",
			"87": ""
		}
	},
	{
		"id": 67,
		"map": "asia",
		"name": "Erzurum",
		"x": 2540,
		"y": 715,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"vp": 1,
		"fort": 3,
		"area": "caucasus",
		"connections": [
			46,
			52,
			58,
			71,
			84
		],
		"rail_connections": [],
		"connection_types": {
			"46": "",
			"52": "",
			"58": "",
			"71": "",
			"84": ""
		}
	},
	{
		"id": 68,
		"map": "asia",
		"name": "Amasya",
		"x": 1923,
		"y": 719,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			53,
			74,
			85,
			86,
			289
		],
		"rail_connections": [],
		"connection_types": {
			"53": "",
			"74": "",
			"85": "",
			"86": "",
			"289": ""
		}
	},
	{
		"id": 69,
		"map": "asia",
		"name": "Ft. Rupel",
		"x": 546,
		"y": 739,
		"nation": "gr",
		"faction": "neutral",
		"terrain": "mountain",
		"fort": 2,
		"area": "balkans",
		"connections": [
			54,
			73,
			75,
			88
		],
		"rail_connections": [
			73,
			75
		],
		"connection_types": {
			"54": "",
			"73": "rail",
			"75": "rail",
			"88": ""
		}
	},
	{
		"id": 70,
		"map": "asia",
		"name": "Monastir",
		"x": 160,
		"y": 751,
		"nation": "sb",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "balkans",
		"connections": [
			50,
			92,
			93
		],
		"rail_connections": [],
		"connection_types": {
			"50": "",
			"92": "",
			"93": ""
		}
	},
	{
		"id": 71,
		"map": "asia",
		"name": "Erzincan",
		"x": 2399,
		"y": 765,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"vp": 1,
		"area": "caucasus",
		"connections": [
			61,
			67,
			74,
			91,
			100
		],
		"rail_connections": [],
		"connection_types": {
			"61": "",
			"67": "",
			"74": "",
			"91": "",
			"100": ""
		}
	},
	{
		"id": 72,
		"map": "asia",
		"name": "Khoy",
		"x": 3100,
		"y": 766,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"area": "azerbaijan",
		"connections": [
			51,
			80,
			87,
			96
		],
		"rail_connections": [],
		"connection_types": {
			"51": "",
			"80": "",
			"87": "",
			"96": ""
		}
	},
	{
		"id": 73,
		"map": "asia",
		"name": "Doiran",
		"x": 350,
		"y": 770,
		"nation": "gr",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "balkans",
		"connections": [
			50,
			54,
			69,
			88,
			95
		],
		"rail_connections": [
			50,
			69,
			95
		],
		"connection_types": {
			"50": "rail",
			"54": "",
			"69": "rail",
			"88": "",
			"95": "rail"
		}
	},
	{
		"id": 74,
		"map": "asia",
		"name": "Sebin Kara-Hissar",
		"x": 2145,
		"y": 771,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			68,
			71,
			86
		],
		"rail_connections": [],
		"connection_types": {
			"68": "",
			"71": "",
			"86": ""
		}
	},
	{
		"id": 75,
		"map": "asia",
		"name": "Xanthi",
		"x": 663,
		"y": 779,
		"nation": "bu",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "balkans",
		"connections": [
			49,
			56,
			69
		],
		"rail_connections": [
			56,
			69
		],
		"connection_types": {
			"49": "",
			"56": "rail",
			"69": "rail"
		}
	},
	{
		"id": 76,
		"map": "asia",
		"name": "Karabuk",
		"x": 1488,
		"y": 787,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			57,
			60,
			81,
			82
		],
		"rail_connections": [],
		"connection_types": {
			"57": "",
			"60": "",
			"81": "",
			"82": ""
		}
	},
	{
		"id": 77,
		"map": "asia",
		"name": "Malazgirt",
		"x": 2743,
		"y": 790,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "caucasus",
		"tribal_activity_grid": "Kurds",
		"connections": [
			62,
			66,
			84
		],
		"rail_connections": [],
		"connection_types": {
			"62": "",
			"66": "",
			"84": ""
		}
	},
	{
		"id": 78,
		"map": "asia",
		"name": "Enzeli",
		"x": 3677,
		"y": 800,
		"nation": "pe",
		"faction": "neutral",
		"terrain": "swamp",
		"port": 2,
		"area": "persia",
		"tribal_activity_grid": "Jangali",
		"connections": [
			59,
			101
		],
		"rail_connections": [],
		"connection_types": {
			"23": "green",
			"59": "",
			"101": "",
			"283": "green"
		},
		"crossings": {
			"283": "bidirectional"
		},
		"connection_nations": {
			"23": [
				"no_tribe"
			],
			"283": [
				"no_tribe"
			]
		},
		"limited_connections": {
			"anz": [
				23,
				59,
				101,
				283
			],
			"ar": [
				23,
				59,
				101,
				283
			],
			"arm": [
				23,
				59,
				101,
				283
			],
			"br": [
				23,
				59,
				101,
				283
			],
			"fr": [
				23,
				59,
				101,
				283
			],
			"gr": [
				23,
				59,
				101,
				283
			],
			"in": [
				23,
				59,
				101,
				283
			],
			"it": [
				23,
				59,
				101,
				283
			],
			"ro": [
				23,
				59,
				101,
				283
			],
			"ru": [
				23,
				59,
				101,
				283
			],
			"sb": [
				23,
				59,
				101,
				283
			],
			"ah": [
				23,
				59,
				101,
				283
			],
			"bu": [
				23,
				59,
				101,
				283
			],
			"ge": [
				23,
				59,
				101,
				283
			],
			"geo": [
				23,
				59,
				101,
				283
			],
			"pe": [
				23,
				59,
				101,
				283
			],
			"re": [
				23,
				59,
				101,
				283
			],
			"tu": [
				23,
				59,
				101,
				283
			],
			"tua": [
				23,
				59,
				101,
				283
			]
		}
	},
	{
		"id": 79,
		"map": "asia",
		"name": "Rodosto",
		"x": 870,
		"y": 803,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "balkans",
		"connections": [
			63,
			89,
			169
		],
		"rail_connections": [],
		"connection_types": {
			"63": "",
			"89": "strait",
			"169": ""
		},
		"connection_straits": {
			"89": 4
		},
		"crossings": {
			"89": "bidirectional"
		},
		"connection_flags": {
			"89": [
				"4"
			]
		}
	},
	{
		"id": 80,
		"map": "asia",
		"name": "Tabriz",
		"x": 3291,
		"y": 817,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"vp": 1,
		"area": "azerbaijan",
		"connections": [
			55,
			64,
			72,
			83,
			99
		],
		"rail_connections": [
			55
		],
		"connection_types": {
			"55": "rail",
			"64": "",
			"72": "",
			"83": "",
			"99": ""
		}
	},
	{
		"id": 81,
		"map": "asia",
		"name": "Cankiri",
		"x": 1629,
		"y": 822,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			76,
			103
		],
		"rail_connections": [],
		"connection_types": {
			"76": "",
			"103": ""
		}
	},
	{
		"id": 82,
		"map": "asia",
		"name": "Adapazari",
		"x": 1305,
		"y": 827,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			76,
			94,
			105,
			287
		],
		"rail_connections": [
			105,
			287
		],
		"connection_types": {
			"76": "",
			"94": "",
			"105": "rail",
			"287": "rail"
		}
	},
	{
		"id": 83,
		"map": "asia",
		"name": "Mianeh",
		"x": 3454,
		"y": 840,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"area": "azerbaijan",
		"connections": [
			64,
			80,
			99,
			110,
			119
		],
		"rail_connections": [],
		"connection_types": {
			"64": "",
			"80": "",
			"99": "",
			"110": "",
			"119": ""
		}
	},
	{
		"id": 84,
		"map": "asia",
		"name": "Mus",
		"x": 2600,
		"y": 831,
		"nation": "tu",
		"faction": "cp",
		"area": "caucasus",
		"tribal_activity_grid": "Kurds",
		"connections": [
			67,
			77,
			98,
			100
		],
		"rail_connections": [],
		"connection_types": {
			"67": "",
			"77": "",
			"98": "",
			"100": ""
		}
	},
	{
		"id": 85,
		"map": "asia",
		"name": "Yozgat",
		"x": 1825,
		"y": 835,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			68,
			86,
			97
		],
		"rail_connections": [],
		"connection_types": {
			"68": "",
			"86": "",
			"97": ""
		}
	},
	{
		"id": 86,
		"map": "asia",
		"name": "Sivas",
		"x": 1985,
		"y": 841,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"vp": 1,
		"area": "anatolia",
		"connections": [
			68,
			74,
			85,
			91,
			106,
			108
		],
		"rail_connections": [],
		"connection_types": {
			"68": "",
			"74": "",
			"85": "",
			"91": "",
			"106": "",
			"108": ""
		}
	},
	{
		"id": 87,
		"map": "asia",
		"name": "Van",
		"x": 2927,
		"y": 860,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"vp": 1,
		"area": "caucasus",
		"tribal_activity_grid": "Kurds",
		"connections": [
			66,
			72,
			98,
			102
		],
		"rail_connections": [],
		"connection_types": {
			"66": "",
			"72": "",
			"98": "",
			"102": ""
		}
	},
	{
		"id": 88,
		"map": "asia",
		"name": "The Struma",
		"x": 476,
		"y": 865,
		"nation": "gr",
		"faction": "neutral",
		"terrain": "swamp",
		"area": "balkans",
		"connections": [
			69,
			73,
			95
		],
		"rail_connections": [],
		"connection_types": {
			"69": "",
			"73": "",
			"95": ""
		}
	},
	{
		"id": 89,
		"map": "asia",
		"name": "Bandirma",
		"x": 984,
		"y": 874,
		"nation": "tu",
		"faction": "cp",
		"area": "anatolia",
		"connections": [
			65,
			79,
			94,
			111,
			191
		],
		"rail_connections": [
			111
		],
		"connection_types": {
			"65": "strait",
			"79": "strait",
			"94": "",
			"111": "rail",
			"191": ""
		},
		"connection_straits": {
			"65": 5,
			"79": 4
		},
		"crossings": {
			"65": "bidirectional",
			"79": "bidirectional"
		},
		"connection_flags": {
			"65": [
				"5"
			],
			"79": [
				"4"
			]
		}
	},
	{
		"id": 90,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 91,
		"map": "asia",
		"name": "Devrigi",
		"x": 2191,
		"y": 886,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			71,
			86,
			109
		],
		"rail_connections": [],
		"connection_types": {
			"71": "",
			"86": "",
			"109": ""
		}
	},
	{
		"id": 92,
		"map": "asia",
		"name": "Florina",
		"x": 228,
		"y": 888,
		"nation": "gr",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "balkans",
		"connections": [
			70,
			93,
			95,
			117
		],
		"rail_connections": [],
		"connection_types": {
			"70": "",
			"93": "",
			"95": "",
			"117": ""
		}
	},
	{
		"id": 93,
		"map": "asia",
		"name": "Prespa",
		"x": 110,
		"y": 896,
		"nation": "gr",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "balkans",
		"connections": [
			70,
			92,
			114
		],
		"rail_connections": [],
		"connection_types": {
			"70": "",
			"92": "",
			"114": ""
		}
	},
	{
		"id": 94,
		"map": "asia",
		"name": "Bursa",
		"x": 1111,
		"y": 896,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			82,
			89,
			105
		],
		"rail_connections": [],
		"connection_types": {
			"82": "",
			"89": "",
			"105": ""
		}
	},
	{
		"id": 95,
		"map": "asia",
		"name": "Salonika",
		"x": 368,
		"y": 906,
		"nation": "gr",
		"faction": "neutral",
		"terrain": "swamp",
		"port": 2,
		"area": "balkans",
		"connections": [
			73,
			88,
			92,
			113,
			117
		],
		"rail_connections": [
			73
		],
		"connection_types": {
			"73": "rail",
			"88": "",
			"92": "",
			"113": "strait",
			"117": ""
		}
	},
	{
		"id": 96,
		"map": "asia",
		"name": "Urmia",
		"x": 3147,
		"y": 911,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"vp": 1,
		"area": "azerbaijan",
		"connections": [
			72,
			102,
			118
		],
		"rail_connections": [],
		"connection_types": {
			"72": "",
			"102": "",
			"118": ""
		}
	},
	{
		"id": 97,
		"map": "asia",
		"name": "Kirikkale",
		"x": 1716,
		"y": 931,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			85,
			103
		],
		"rail_connections": [],
		"connection_types": {
			"85": "",
			"103": ""
		}
	},
	{
		"id": 98,
		"map": "asia",
		"name": "Bitlis",
		"x": 2735,
		"y": 931,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "caucasus",
		"connections": [
			84,
			87,
			116,
			120
		],
		"rail_connections": [],
		"connection_types": {
			"84": "",
			"87": "",
			"116": "",
			"120": ""
		}
	},
	{
		"id": 99,
		"map": "asia",
		"name": "Maragha",
		"x": 3351,
		"y": 939,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"area": "azerbaijan",
		"connections": [
			80,
			83,
			118,
			119
		],
		"rail_connections": [],
		"connection_types": {
			"80": "",
			"83": "",
			"118": "",
			"119": ""
		}
	},
	{
		"id": 100,
		"map": "asia",
		"name": "Harput",
		"x": 2427,
		"y": 941,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "caucasus",
		"tribal_activity_grid": "Kurds",
		"connections": [
			71,
			84,
			109,
			120
		],
		"rail_connections": [],
		"connection_types": {
			"71": "",
			"84": "",
			"109": "",
			"120": ""
		}
	},
	{
		"id": 101,
		"map": "asia",
		"name": "Menjil",
		"x": 3727,
		"y": 942,
		"nation": "pe",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "persia",
		"tribal_activity_grid": "Jangali",
		"connections": [
			78,
			115
		],
		"rail_connections": [],
		"connection_types": {
			"78": "",
			"115": ""
		}
	},
	{
		"id": 102,
		"map": "asia",
		"name": "Baskale",
		"x": 3032,
		"y": 954,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "caucasus",
		"tribal_activity_grid": "Kurds",
		"connections": [
			87,
			96
		],
		"rail_connections": [],
		"connection_types": {
			"87": "",
			"96": ""
		}
	},
	{
		"id": 103,
		"map": "asia",
		"name": "Ankara",
		"x": 1540,
		"y": 967,
		"nation": "tu",
		"faction": "cp",
		"vp": 1,
		"area": "anatolia",
		"connections": [
			81,
			97,
			104,
			121
		],
		"rail_connections": [
			104
		],
		"connection_types": {
			"81": "",
			"97": "",
			"104": "rail",
			"121": ""
		}
	},
	{
		"id": 104,
		"map": "asia",
		"name": "Sevrehissar",
		"x": 1396,
		"y": 982,
		"nation": "tu",
		"faction": "cp",
		"area": "anatolia",
		"connections": [
			103,
			105
		],
		"rail_connections": [
			103,
			105
		],
		"connection_types": {
			"103": "rail",
			"105": "rail"
		}
	},
	{
		"id": 105,
		"map": "asia",
		"name": "Eskishehir",
		"x": 1250,
		"y": 983,
		"nation": "tu",
		"faction": "cp",
		"area": "anatolia",
		"connections": [
			82,
			94,
			104,
			111,
			124
		],
		"rail_connections": [
			82,
			104,
			124
		],
		"connection_types": {
			"82": "rail",
			"94": "",
			"104": "rail",
			"111": "",
			"124": "rail"
		}
	},
	{
		"id": 106,
		"map": "asia",
		"name": "Kayseri",
		"x": 1968,
		"y": 985,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"vp": 1,
		"area": "anatolia",
		"connections": [
			86,
			107,
			123
		],
		"rail_connections": [],
		"connection_types": {
			"86": "",
			"107": "",
			"123": ""
		}
	},
	{
		"id": 107,
		"map": "asia",
		"name": "Nevsehir",
		"x": 1839,
		"y": 1002,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			106,
			121
		],
		"rail_connections": [],
		"connection_types": {
			"106": "",
			"121": ""
		}
	},
	{
		"id": 108,
		"map": "asia",
		"name": "Arapkir",
		"x": 2127,
		"y": 1007,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			86,
			109
		],
		"rail_connections": [],
		"connection_types": {
			"86": "",
			"109": ""
		}
	},
	{
		"id": 109,
		"map": "asia",
		"name": "Malatya",
		"x": 2278,
		"y": 1010,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			91,
			100,
			108
		],
		"rail_connections": [],
		"connection_types": {
			"91": "",
			"100": "",
			"108": ""
		}
	},
	{
		"id": 110,
		"map": "asia",
		"name": "Zenjan",
		"x": 3618,
		"y": 1018,
		"nation": "pe",
		"faction": "neutral",
		"area": "persia",
		"connections": [
			83,
			115
		],
		"rail_connections": [],
		"connection_types": {
			"83": "",
			"115": ""
		}
	},
	{
		"id": 111,
		"map": "asia",
		"name": "Balikesir",
		"x": 1015,
		"y": 1020,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			89,
			105,
			112,
			128
		],
		"rail_connections": [
			89,
			128
		],
		"connection_types": {
			"89": "rail",
			"105": "",
			"112": "",
			"128": "rail"
		}
	},
	{
		"id": 112,
		"map": "asia",
		"name": "Edremit",
		"x": 886,
		"y": 1030,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			111,
			128,
			250
		],
		"rail_connections": [],
		"connection_types": {
			"111": "",
			"128": "",
			"250": ""
		}
	},
	{
		"id": 113,
		"map": "asia",
		"name": "Thermaikos Bay",
		"x": 461,
		"y": 1040,
		"nation": "br",
		"faction": "ap",
		"beach_for": "Lemnos",
		"area": "balkans",
		"connections": [
			95,
			288
		],
		"rail_connections": [],
		"connection_types": {
			"95": "strait",
			"288": "strait"
		},
		"crossings": {
			"95": "a_to_b"
		}
	},
	{
		"id": 114,
		"map": "asia",
		"name": "Trikkala",
		"x": 153,
		"y": 1042,
		"nation": "gr",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "balkans",
		"connections": [
			93,
			117,
			131
		],
		"rail_connections": [],
		"connection_types": {
			"93": "",
			"117": "",
			"131": ""
		}
	},
	{
		"id": 115,
		"map": "asia",
		"name": "Kazvin",
		"x": 3807,
		"y": 1043,
		"nation": "pe",
		"faction": "neutral",
		"area": "persia",
		"connections": [
			101,
			110,
			122,
			130
		],
		"rail_connections": [],
		"connection_types": {
			"101": "",
			"110": "",
			"122": "",
			"130": ""
		}
	},
	{
		"id": 116,
		"map": "asia",
		"name": "Cizre",
		"x": 2807,
		"y": 1045,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "caucasus",
		"connections": [
			98,
			120,
			134
		],
		"rail_connections": [],
		"connection_types": {
			"98": "",
			"120": "",
			"134": ""
		}
	},
	{
		"id": 117,
		"map": "asia",
		"name": "Larissa",
		"x": 286,
		"y": 1048,
		"nation": "gr",
		"faction": "neutral",
		"area": "balkans",
		"connections": [
			92,
			95,
			114,
			131
		],
		"rail_connections": [],
		"connection_types": {
			"92": "",
			"95": "",
			"114": "",
			"131": ""
		}
	},
	{
		"id": 118,
		"map": "asia",
		"name": "Suj Bulak",
		"x": 3276,
		"y": 1051,
		"nation": "ru",
		"faction": "ap",
		"terrain": "mountain",
		"area": "azerbaijan",
		"tribal_activity_grid": "Kurds",
		"connections": [
			96,
			99,
			125
		],
		"rail_connections": [],
		"connection_types": {
			"96": "",
			"99": "",
			"125": ""
		}
	},
	{
		"id": 119,
		"map": "asia",
		"name": "Saqqiz",
		"x": 3479,
		"y": 1054,
		"nation": "pe",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "persia",
		"connections": [
			83,
			99,
			132
		],
		"rail_connections": [],
		"connection_types": {
			"83": "",
			"99": "",
			"132": ""
		}
	},
	{
		"id": 120,
		"map": "asia",
		"name": "Diyarbekir",
		"x": 2525,
		"y": 1057,
		"nation": "tu",
		"faction": "cp",
		"vp": 1,
		"area": "caucasus",
		"tribal_activity_grid": "Kurds",
		"connections": [
			98,
			100,
			116,
			129,
			137
		],
		"rail_connections": [],
		"connection_types": {
			"98": "",
			"100": "",
			"116": "",
			"129": "",
			"137": ""
		}
	},
	{
		"id": 121,
		"map": "asia",
		"name": "Kirsehir",
		"x": 1710,
		"y": 1066,
		"nation": "tu",
		"faction": "cp",
		"area": "anatolia",
		"connections": [
			103,
			107
		],
		"rail_connections": [],
		"connection_types": {
			"103": "",
			"107": ""
		}
	},
	{
		"id": 122,
		"map": "asia",
		"name": "TEHERAN",
		"x": 3967,
		"y": 1075,
		"nation": "pe",
		"faction": "neutral",
		"terrain": "mountain",
		"vp": 1,
		"capital": 1,
		"area": "persia",
		"connections": [
			115,
			133,
			292
		],
		"rail_connections": [],
		"connection_types": {
			"115": "",
			"133": "",
			"292": "green"
		}
	},
	{
		"id": 123,
		"map": "asia",
		"name": "Nigde",
		"x": 1874,
		"y": 1116,
		"nation": "tu",
		"faction": "cp",
		"area": "anatolia",
		"connections": [
			106,
			139
		],
		"rail_connections": [],
		"connection_types": {
			"106": "",
			"139": ""
		}
	},
	{
		"id": 124,
		"map": "asia",
		"name": "Afyon",
		"x": 1322,
		"y": 1117,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"vp": 1,
		"area": "anatolia",
		"connections": [
			105,
			127,
			142,
			144
		],
		"rail_connections": [
			105,
			127,
			142
		],
		"connection_types": {
			"105": "rail",
			"127": "rail",
			"142": "rail",
			"144": ""
		}
	},
	{
		"id": 125,
		"map": "asia",
		"name": "Ruwandiz",
		"x": 3123,
		"y": 1118,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "mesopotamia",
		"tribal_activity_grid": "Kurds",
		"connections": [
			118,
			134
		],
		"rail_connections": [],
		"connection_types": {
			"118": "",
			"134": ""
		}
	},
	{
		"id": 126,
		"map": "asia",
		"name": "to Smyrna",
		"x": 725,
		"y": 1128,
		"nation": "br",
		"faction": "ap",
		"beach_for": "Lemnos",
		"connections": [
			135,
			288
		],
		"rail_connections": [],
		"connection_types": {
			"135": "strait",
			"288": "strait"
		},
		"crossings": {
			"135": "a_to_b"
		}
	},
	{
		"id": 127,
		"map": "asia",
		"name": "Usak",
		"x": 1150,
		"y": 1135,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			124,
			128
		],
		"rail_connections": [
			124,
			128
		],
		"connection_types": {
			"124": "rail",
			"128": "rail"
		}
	},
	{
		"id": 128,
		"map": "asia",
		"name": "Manisa",
		"x": 1004,
		"y": 1136,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			111,
			112,
			127,
			135
		],
		"rail_connections": [
			111,
			127,
			135
		],
		"connection_types": {
			"111": "rail",
			"112": "",
			"127": "rail",
			"135": "rail"
		}
	},
	{
		"id": 129,
		"map": "asia",
		"name": "Mardin",
		"x": 2636,
		"y": 1143,
		"nation": "tu",
		"faction": "cp",
		"vp": 1,
		"area": "caucasus",
		"tribal_activity_grid": "Kurds",
		"connections": [
			120,
			141
		],
		"rail_connections": [],
		"connection_types": {
			"120": "",
			"141": ""
		}
	},
	{
		"id": 130,
		"map": "asia",
		"name": "Sultan Bulak",
		"x": 3798,
		"y": 1161,
		"nation": "pe",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "persia",
		"connections": [
			115,
			138
		],
		"rail_connections": [],
		"connection_types": {
			"115": "",
			"138": ""
		}
	},
	{
		"id": 131,
		"map": "asia",
		"name": "Lamia",
		"x": 352,
		"y": 1183,
		"nation": "gr",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "balkans",
		"connections": [
			114,
			117,
			149
		],
		"rail_connections": [],
		"connection_types": {
			"114": "",
			"117": "",
			"149": ""
		}
	},
	{
		"id": 132,
		"map": "asia",
		"name": "Sehneh",
		"x": 3501,
		"y": 1209,
		"nation": "pe",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "persia",
		"connections": [
			119,
			148,
			152
		],
		"rail_connections": [],
		"connection_types": {
			"119": "",
			"148": "",
			"152": ""
		}
	},
	{
		"id": 133,
		"map": "asia",
		"name": "Qum",
		"x": 3971,
		"y": 1209,
		"nation": "pe",
		"faction": "neutral",
		"area": "persia",
		"jihad_city": true,
		"connections": [
			122,
			147,
			151
		],
		"rail_connections": [],
		"connection_types": {
			"122": "",
			"147": "",
			"151": ""
		}
	},
	{
		"id": 134,
		"map": "asia",
		"name": "Mosul",
		"x": 2899,
		"y": 1213,
		"nation": "tu",
		"faction": "cp",
		"vp": 1,
		"area": "mesopotamia",
		"tribal_activity_grid": "Kurds",
		"connections": [
			116,
			125,
			141,
			146,
			154
		],
		"rail_connections": [],
		"connection_types": {
			"116": "",
			"125": "",
			"141": "",
			"146": "",
			"154": ""
		}
	},
	{
		"id": 135,
		"map": "asia",
		"name": "Smyrna",
		"x": 875,
		"y": 1228,
		"nation": "tu",
		"faction": "cp",
		"vp": 1,
		"fort": 1,
		"port": 1,
		"area": "anatolia",
		"connections": [
			126,
			128,
			143
		],
		"rail_connections": [
			128,
			143
		],
		"connection_types": {
			"126": "strait",
			"128": "rail",
			"143": "rail"
		}
	},
	{
		"id": 136,
		"map": "asia",
		"name": "to Athens",
		"x": 652,
		"y": 1232,
		"nation": "br",
		"faction": "ap",
		"beach_for": "Lemnos",
		"area": "balkans",
		"connections": [
			149,
			288
		],
		"rail_connections": [],
		"connection_types": {
			"149": "strait",
			"288": "strait"
		},
		"crossings": {
			"149": "a_to_b"
		}
	},
	{
		"id": 137,
		"map": "asia",
		"name": "Ras-ul-Ain",
		"x": 2349,
		"y": 1230,
		"nation": "tu",
		"faction": "cp",
		"area": "mesopotamia",
		"connections": [
			120,
			141,
			155
		],
		"rail_connections": [
			155
		],
		"connection_types": {
			"120": "",
			"141": "",
			"155": "rail"
		}
	},
	{
		"id": 138,
		"map": "asia",
		"name": "Hamadan",
		"x": 3670,
		"y": 1235,
		"nation": "pe",
		"faction": "neutral",
		"terrain": "mountain",
		"vp": 1,
		"area": "persia",
		"connections": [
			130,
			152,
			153
		],
		"rail_connections": [],
		"connection_types": {
			"130": "",
			"152": "",
			"153": ""
		}
	},
	{
		"id": 139,
		"map": "asia",
		"name": "Eregli",
		"x": 1824,
		"y": 1247,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			123,
			142,
			150
		],
		"rail_connections": [
			142,
			150
		],
		"connection_types": {
			"123": "",
			"142": "rail",
			"150": "conditional_rail"
		},
		"connection_flags": {
			"150": [
				"event_berlin_baghdad",
				"virtual"
			]
		}
	},
	{
		"id": 140,
		"map": "asia",
		"name": "Mamure Station",
		"x": 2094,
		"y": 1232,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			150,
			155,
			159
		],
		"rail_connections": [
			150,
			155,
			159
		],
		"connection_types": {
			"150": "rail",
			"155": "conditional_rail",
			"159": "rail"
		},
		"connection_flags": {
			"155": [
				"event_berlin_baghdad",
				"virtual"
			]
		}
	},
	{
		"id": 141,
		"map": "asia",
		"name": "Nazibin",
		"x": 2743,
		"y": 1248,
		"nation": "tu",
		"faction": "cp",
		"area": "mesopotamia",
		"connections": [
			129,
			134,
			137,
			156
		],
		"rail_connections": [],
		"connection_types": {
			"129": "",
			"134": "",
			"137": "",
			"156": ""
		}
	},
	{
		"id": 142,
		"map": "asia",
		"name": "Konya",
		"x": 1605,
		"y": 1198,
		"nation": "tu",
		"faction": "cp",
		"vp": 1,
		"area": "anatolia",
		"connections": [
			124,
			139
		],
		"rail_connections": [
			124,
			139
		],
		"connection_types": {
			"124": "rail",
			"139": "rail"
		}
	},
	{
		"id": 143,
		"map": "asia",
		"name": "Aydin",
		"x": 1039,
		"y": 1277,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			135,
			145,
			164
		],
		"rail_connections": [
			135,
			145
		],
		"connection_types": {
			"135": "rail",
			"145": "rail",
			"164": ""
		}
	},
	{
		"id": 144,
		"map": "asia",
		"name": "Isparta",
		"x": 1330,
		"y": 1277,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			124,
			145,
			162
		],
		"rail_connections": [
			145
		],
		"connection_types": {
			"124": "",
			"145": "rail",
			"162": ""
		}
	},
	{
		"id": 145,
		"map": "asia",
		"name": "Denizli",
		"x": 1188,
		"y": 1283,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			143,
			144
		],
		"rail_connections": [
			143,
			144
		],
		"connection_types": {
			"143": "rail",
			"144": "rail"
		}
	},
	{
		"id": 146,
		"map": "asia",
		"name": "Kirkuk",
		"x": 3125,
		"y": 1283,
		"nation": "tu",
		"faction": "cp",
		"area": "mesopotamia",
		"tribal_activity_grid": "Kurds",
		"connections": [
			134,
			148,
			154
		],
		"rail_connections": [],
		"connection_types": {
			"134": "",
			"148": "",
			"154": ""
		}
	},
	{
		"id": 147,
		"map": "asia",
		"name": "Sultanabad",
		"x": 3896,
		"y": 1317,
		"nation": "pe",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "persia",
		"connections": [
			133,
			153
		],
		"rail_connections": [],
		"connection_types": {
			"133": "",
			"153": ""
		}
	},
	{
		"id": 148,
		"map": "asia",
		"name": "Suleymaniye",
		"x": 3312,
		"y": 1321,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "mesopotamia",
		"tribal_activity_grid": "Kurds",
		"connections": [
			132,
			146,
			168
		],
		"rail_connections": [],
		"connection_types": {
			"132": "",
			"146": "",
			"168": ""
		}
	},
	{
		"id": 149,
		"map": "asia",
		"name": "ATHENS",
		"x": 466,
		"y": 1334,
		"nation": "gr",
		"faction": "neutral",
		"vp": 1,
		"port": 2,
		"capital": 1,
		"area": "balkans",
		"connections": [
			131,
			136
		],
		"rail_connections": [],
		"connection_types": {
			"131": "",
			"136": "strait"
		}
	},
	{
		"id": 150,
		"map": "asia",
		"name": "Adana",
		"x": 1933,
		"y": 1338,
		"nation": "tu",
		"faction": "cp",
		"port": 1,
		"area": "anatolia",
		"connections": [
			139,
			140,
			157,
			166
		],
		"rail_connections": [
			139,
			140,
			157
		],
		"connection_types": {
			"139": "conditional_rail",
			"140": "rail",
			"157": "rail",
			"166": "strait"
		},
		"connection_flags": {
			"139": [
				"event_berlin_baghdad",
				"virtual"
			]
		}
	},
	{
		"id": 151,
		"map": "asia",
		"name": "Kashan",
		"x": 4062,
		"y": 1341,
		"nation": "pe",
		"faction": "neutral",
		"area": "persia",
		"connections": [
			133,
			172,
			174
		],
		"rail_connections": [],
		"connection_types": {
			"133": "",
			"172": "",
			"174": "green"
		}
	},
	{
		"id": 152,
		"map": "asia",
		"name": "Kermanshah",
		"x": 3601,
		"y": 1347,
		"nation": "pe",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "persia",
		"tribal_activity_grid": "Sinjabi",
		"connections": [
			132,
			138,
			163
		],
		"rail_connections": [],
		"connection_types": {
			"132": "",
			"138": "",
			"163": ""
		}
	},
	{
		"id": 153,
		"map": "asia",
		"name": "Burujird",
		"x": 3769,
		"y": 1356,
		"nation": "pe",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "persia",
		"connections": [
			138,
			147,
			173
		],
		"rail_connections": [],
		"connection_types": {
			"138": "",
			"147": "",
			"173": ""
		}
	},
	{
		"id": 154,
		"map": "asia",
		"name": "Tikrit",
		"x": 2982,
		"y": 1359,
		"nation": "tu",
		"faction": "cp",
		"area": "mesopotamia",
		"connections": [
			134,
			146,
			167
		],
		"rail_connections": [],
		"connection_types": {
			"134": "",
			"146": "",
			"167": ""
		}
	},
	{
		"id": 155,
		"map": "asia",
		"name": "Aleppo",
		"x": 2223,
		"y": 1366,
		"nation": "tu",
		"faction": "cp",
		"vp": 1,
		"area": "syria_palestine",
		"connections": [
			137,
			140,
			159,
			160,
			171
		],
		"rail_connections": [
			137,
			140,
			171
		],
		"connection_types": {
			"137": "rail",
			"140": "conditional_rail",
			"159": "",
			"160": "",
			"171": "rail"
		},
		"connection_flags": {
			"140": [
				"event_berlin_baghdad",
				"virtual"
			]
		}
	},
	{
		"id": 156,
		"map": "asia",
		"name": "Al Hasakah",
		"x": 2672,
		"y": 1366,
		"nation": "tu",
		"faction": "cp",
		"area": "mesopotamia",
		"connections": [
			141,
			161
		],
		"rail_connections": [],
		"connection_types": {
			"141": "",
			"161": ""
		}
	},
	{
		"id": 157,
		"map": "asia",
		"name": "Mersin",
		"x": 1762,
		"y": 1439,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			150,
			158
		],
		"rail_connections": [
			150
		],
		"connection_types": {
			"150": "rail",
			"158": ""
		}
	},
	{
		"id": 158,
		"map": "asia",
		"name": "Akseki",
		"x": 1545,
		"y": 1378,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "anatolia",
		"connections": [
			157,
			162
		],
		"rail_connections": [],
		"connection_types": {
			"157": "",
			"162": ""
		}
	},
	{
		"id": 159,
		"map": "asia",
		"name": "Alexandretta",
		"x": 2080,
		"y": 1381,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"port": 1,
		"area": "anatolia",
		"connections": [
			140,
			155,
			170
		],
		"rail_connections": [
			140
		],
		"connection_types": {
			"140": "rail",
			"155": "",
			"170": ""
		}
	},
	{
		"id": 160,
		"map": "asia",
		"name": "Rakka",
		"x": 2384,
		"y": 1392,
		"nation": "tu",
		"faction": "cp",
		"area": "mesopotamia",
		"connections": [
			155,
			161
		],
		"rail_connections": [],
		"connection_types": {
			"155": "",
			"161": ""
		}
	},
	{
		"id": 161,
		"map": "asia",
		"name": "Deir es Zor",
		"x": 2543,
		"y": 1412,
		"nation": "tu",
		"faction": "cp",
		"area": "mesopotamia",
		"connections": [
			156,
			160,
			175
		],
		"rail_connections": [],
		"connection_types": {
			"156": "",
			"160": "",
			"175": ""
		}
	},
	{
		"id": 162,
		"map": "asia",
		"name": "Antalya",
		"x": 1377,
		"y": 1413,
		"nation": "tu",
		"faction": "cp",
		"port": 1,
		"area": "anatolia",
		"connections": [
			144,
			158
		],
		"rail_connections": [],
		"connection_types": {
			"144": "",
			"158": ""
		}
	},
	{
		"id": 163,
		"map": "asia",
		"name": "Karind",
		"x": 3467,
		"y": 1434,
		"nation": "pe",
		"faction": "neutral",
		"terrain": "mountain",
		"area": "persia",
		"connections": [
			152,
			168
		],
		"rail_connections": [],
		"connection_types": {
			"152": "",
			"168": ""
		}
	},
	{
		"id": 164,
		"map": "asia",
		"name": "Mugla",
		"x": 1084,
		"y": 1454,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"port": 1,
		"area": "anatolia",
		"connections": [
			143
		],
		"rail_connections": [],
		"connection_types": {
			"143": ""
		}
	},
	{
		"id": 165,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 166,
		"map": "asia",
		"name": "To Adana",
		"x": 1869,
		"y": 1479,
		"nation": "br",
		"faction": "ap",
		"beach_for": "Cyprus",
		"connections": [
			150,
			183
		],
		"rail_connections": [],
		"connection_types": {
			"150": "strait",
			"183": "strait"
		},
		"crossings": {
			"150": "a_to_b"
		}
	},
	{
		"id": 167,
		"map": "asia",
		"name": "Samarra",
		"x": 3082,
		"y": 1482,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"area": "mesopotamia",
		"connections": [
			154,
			184
		],
		"rail_connections": [
			184
		],
		"connection_types": {
			"154": "",
			"184": "rail"
		}
	},
	{
		"id": 168,
		"map": "asia",
		"name": "Khanikan",
		"x": 3306,
		"y": 1482,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "mesopotamia",
		"tribal_activity_grid": "Kurds",
		"connections": [
			148,
			163,
			184
		],
		"rail_connections": [],
		"connection_types": {
			"148": "",
			"163": "",
			"184": ""
		}
	},
	{
		"id": 169,
		"map": "gallipoli",
		"name": "Bulair",
		"x": 649,
		"y": 1483,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "gallipoli",
		"connections": [
			79,
			178
		],
		"rail_connections": [],
		"connection_types": {
			"79": "",
			"178": ""
		}
	},
	{
		"id": 170,
		"map": "asia",
		"name": "Antioch",
		"x": 2148,
		"y": 1488,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "syria_palestine",
		"connections": [
			159,
			171
		],
		"rail_connections": [],
		"connection_types": {
			"159": "",
			"171": ""
		}
	},
	{
		"id": 171,
		"map": "asia",
		"name": "Hama",
		"x": 2272,
		"y": 1497,
		"nation": "tu",
		"faction": "cp",
		"area": "syria_palestine",
		"connections": [
			155,
			170,
			182
		],
		"rail_connections": [
			155,
			182
		],
		"connection_types": {
			"155": "rail",
			"170": "",
			"182": "rail"
		}
	},
	{
		"id": 172,
		"map": "asia",
		"name": "Isfahan",
		"x": 4019,
		"y": 1501,
		"nation": "pe",
		"faction": "neutral",
		"terrain": "mountain",
		"vp": 1,
		"area": "persia",
		"tribal_activity_grid": "Bakhtiari",
		"connections": [
			151,
			174,
			201
		],
		"rail_connections": [],
		"connection_types": {
			"151": "",
			"174": "green",
			"201": "green"
		}
	},
	{
		"id": 173,
		"map": "asia",
		"name": "Dizful",
		"x": 3834,
		"y": 1504,
		"nation": "pe",
		"faction": "neutral",
		"area": "persia",
		"connections": [
			153,
			186
		],
		"rail_connections": [],
		"connection_types": {
			"153": "",
			"186": ""
		}
	},
	{
		"id": 174,
		"map": "asia",
		"name": "Shiraz",
		"x": 4199,
		"y": 1532,
		"nation": "pe",
		"faction": "ap",
		"terrain": "mountain",
		"vp": 1,
		"region": "central persia",
		"area": "persia",
		"tribal_activity_grid": "Qashqai",
		"connections": [
			151,
			172,
			201,
			292
		],
		"rail_connections": [],
		"connection_types": {
			"151": "green",
			"172": "green",
			"201": "green",
			"292": "green"
		}
	},
	{
		"id": 175,
		"map": "asia",
		"name": "Mayadin",
		"x": 2676,
		"y": 1535,
		"nation": "tu",
		"faction": "cp",
		"area": "mesopotamia",
		"connections": [
			161,
			181
		],
		"rail_connections": [],
		"connection_types": {
			"161": "",
			"181": ""
		}
	},
	{
		"id": 176,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 177,
		"map": "gallipoli",
		"name": "Taifur Keui",
		"x": 456,
		"y": 1576,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "gallipoli",
		"connections": [
			178,
			180,
			187
		],
		"rail_connections": [],
		"connection_types": {
			"178": "",
			"180": "",
			"187": ""
		}
	},
	{
		"id": 178,
		"map": "gallipoli",
		"name": "Gallipoli",
		"x": 590,
		"y": 1583,
		"nation": "tu",
		"faction": "cp",
		"vp": 1,
		"fort": 1,
		"port": 1,
		"area": "gallipoli",
		"connections": [
			169,
			177,
			187,
			191
		],
		"rail_connections": [],
		"connection_types": {
			"169": "",
			"177": "",
			"187": "",
			"191": "strait"
		},
		"connection_straits": {
			"191": 3
		},
		"crossings": {
			"191": "bidirectional"
		},
		"connection_flags": {
			"191": [
				"3"
			]
		}
	},
	{
		"id": 179,
		"map": "asia",
		"name": "Hit",
		"x": 2912,
		"y": 1588,
		"nation": "tu",
		"faction": "cp",
		"area": "mesopotamia",
		"connections": [
			181,
			189
		],
		"rail_connections": [],
		"connection_types": {
			"181": "",
			"189": ""
		}
	},
	{
		"id": 180,
		"map": "gallipoli",
		"name": "Karnabikeui",
		"x": 336,
		"y": 1603,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "gallipoli",
		"connections": [
			177,
			188,
			199
		],
		"rail_connections": [],
		"connection_types": {
			"177": "",
			"188": "",
			"199": ""
		}
	},
	{
		"id": 181,
		"map": "asia",
		"name": "El Ghaim",
		"x": 2782,
		"y": 1611,
		"nation": "tu",
		"faction": "cp",
		"area": "mesopotamia",
		"connections": [
			175,
			179
		],
		"rail_connections": [],
		"connection_types": {
			"175": "",
			"179": ""
		}
	},
	{
		"id": 182,
		"map": "asia",
		"name": "Homs",
		"x": 2292,
		"y": 1613,
		"nation": "tu",
		"faction": "cp",
		"area": "syria_palestine",
		"connections": [
			171,
			193
		],
		"rail_connections": [
			171,
			193
		],
		"connection_types": {
			"171": "rail",
			"193": "rail"
		}
	},
	{
		"id": 183,
		"map": "asia",
		"name": "Cyprus",
		"x": 1819,
		"y": 1619,
		"nation": "br",
		"faction": "ap",
		"port": 2,
		"island_base": "Cyprus",
		"connections": [
			166,
			192,
			209,
			223
		],
		"rail_connections": [],
		"connection_types": {
			"166": "strait",
			"192": "strait",
			"209": "strait",
			"223": "strait"
		}
	},
	{
		"id": 184,
		"map": "asia",
		"name": "Baghdad",
		"x": 3223,
		"y": 1621,
		"nation": "tu",
		"faction": "cp",
		"vp": 2,
		"area": "mesopotamia",
		"jihad_city": true,
		"connections": [
			167,
			168,
			185,
			189,
			195
		],
		"rail_connections": [
			167
		],
		"connection_types": {
			"167": "rail",
			"168": "",
			"185": "",
			"189": "",
			"195": ""
		}
	},
	{
		"id": 185,
		"map": "asia",
		"name": "Ctesiphon",
		"x": 3341,
		"y": 1665,
		"nation": "tu",
		"faction": "cp",
		"area": "mesopotamia",
		"connections": [
			184,
			194
		],
		"rail_connections": [],
		"connection_types": {
			"184": "",
			"194": ""
		}
	},
	{
		"id": 186,
		"map": "asia",
		"name": "Shuster",
		"x": 3928,
		"y": 1676,
		"nation": "br",
		"faction": "ap",
		"terrain": "mountain",
		"vp": 1,
		"area": "arabistan",
		"connections": [
			173,
			207
		],
		"rail_connections": [],
		"connection_types": {
			"173": "",
			"207": ""
		}
	},
	{
		"id": 187,
		"map": "gallipoli",
		"name": "Bair Keui",
		"x": 513,
		"y": 1692,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "gallipoli",
		"connections": [
			177,
			178,
			199
		],
		"rail_connections": [],
		"connection_types": {
			"177": "",
			"178": "",
			"199": ""
		}
	},
	{
		"id": 188,
		"map": "gallipoli",
		"name": "Anafarta",
		"x": 223,
		"y": 1694,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "gallipoli",
		"connections": [
			180,
			197,
			199,
			204
		],
		"rail_connections": [],
		"connection_types": {
			"180": "",
			"197": "strait",
			"199": "",
			"204": ""
		}
	},
	{
		"id": 189,
		"map": "asia",
		"name": "Ramadi",
		"x": 3030,
		"y": 1694,
		"nation": "tu",
		"faction": "cp",
		"area": "mesopotamia",
		"connections": [
			179,
			184,
			195,
			205
		],
		"rail_connections": [],
		"connection_types": {
			"179": "",
			"184": "",
			"195": "",
			"205": ""
		}
	},
	{
		"id": 190,
		"map": "asia",
		"name": "Sannaiyat",
		"x": 3653,
		"y": 1702,
		"nation": "tu",
		"faction": "cp",
		"area": "mesopotamia",
		"connections": [
			198,
			203
		],
		"rail_connections": [],
		"connection_types": {
			"198": "",
			"203": ""
		},
		"crossings": {
			"198": "bidirectional"
		}
	},
	{
		"id": 191,
		"map": "gallipoli",
		"name": "Chardak",
		"x": 657,
		"y": 1709,
		"nation": "tu",
		"faction": "cp",
		"area": "gallipoli",
		"connections": [
			89,
			178,
			211
		],
		"rail_connections": [],
		"connection_types": {
			"89": "",
			"178": "strait",
			"211": ""
		},
		"connection_straits": {
			"178": 3
		},
		"crossings": {
			"178": "bidirectional"
		},
		"connection_flags": {
			"178": [
				"3"
			]
		}
	},
	{
		"id": 192,
		"map": "asia",
		"name": "To Beirut",
		"x": 1943,
		"y": 1723,
		"nation": "br",
		"faction": "ap",
		"beach_for": "Cyprus",
		"connections": [
			183,
			196
		],
		"rail_connections": [],
		"connection_types": {
			"183": "strait",
			"196": "strait"
		},
		"crossings": {
			"196": "a_to_b"
		}
	},
	{
		"id": 193,
		"map": "asia",
		"name": "Riyaq",
		"x": 2207,
		"y": 1703,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "syria_palestine",
		"connections": [
			182,
			196,
			202
		],
		"rail_connections": [
			182,
			196,
			202
		],
		"connection_types": {
			"182": "rail",
			"196": "rail",
			"202": "rail"
		}
	},
	{
		"id": 194,
		"map": "asia",
		"name": "Aziziya",
		"x": 3436,
		"y": 1731,
		"nation": "tu",
		"faction": "cp",
		"area": "mesopotamia",
		"connections": [
			185,
			198,
			206
		],
		"rail_connections": [],
		"connection_types": {
			"185": "",
			"198": "",
			"206": ""
		},
		"crossings": {
			"198": "b_to_a"
		}
	},
	{
		"id": 195,
		"map": "asia",
		"name": "Museyib",
		"x": 3226,
		"y": 1732,
		"nation": "tu",
		"faction": "cp",
		"area": "mesopotamia",
		"connections": [
			184,
			189,
			205,
			206
		],
		"rail_connections": [],
		"connection_types": {
			"184": "",
			"189": "",
			"205": "",
			"206": ""
		}
	},
	{
		"id": 196,
		"map": "asia",
		"name": "Beirut",
		"x": 2100,
		"y": 1753,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"port": 1,
		"area": "syria_palestine",
		"connections": [
			192,
			193,
			213
		],
		"rail_connections": [
			193
		],
		"connection_types": {
			"192": "strait",
			"193": "rail",
			"213": ""
		}
	},
	{
		"id": 197,
		"map": "gallipoli",
		"name": "Suvla Bay",
		"x": 145,
		"y": 1761,
		"nation": "br",
		"faction": "ap",
		"beach_for": "Lemnos",
		"area": "gallipoli",
		"connections": [
			188,
			288
		],
		"rail_connections": [],
		"connection_types": {
			"188": "strait",
			"288": "strait"
		},
		"crossings": {
			"188": "b_to_a"
		}
	},
	{
		"id": 198,
		"map": "asia",
		"name": "Kut",
		"x": 3542,
		"y": 1769,
		"nation": "tu",
		"faction": "cp",
		"vp": 1,
		"area": "mesopotamia",
		"tribal_activity_grid": "Marsh",
		"connections": [
			190,
			194,
			214
		],
		"rail_connections": [],
		"connection_types": {
			"190": "",
			"194": "",
			"214": ""
		},
		"crossings": {
			"190": "bidirectional"
		}
	},
	{
		"id": 199,
		"map": "gallipoli",
		"name": "Yalova",
		"x": 393,
		"y": 1771,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "gallipoli",
		"connections": [
			180,
			187,
			188,
			204,
			218
		],
		"rail_connections": [],
		"connection_types": {
			"180": "",
			"187": "",
			"188": "",
			"204": "",
			"218": ""
		}
	},
	{
		"id": 200,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 201,
		"map": "asia",
		"name": "Bushire",
		"x": 4120,
		"y": 1789,
		"nation": "pe",
		"faction": "ap",
		"terrain": "mountain",
		"vp": 1,
		"port": 2,
		"region": "south persia",
		"area": "persia",
		"tribal_activity_grid": "Tangistani",
		"connections": [
			172,
			174,
			225,
			299
		],
		"rail_connections": [],
		"connection_types": {
			"172": "green",
			"174": "green",
			"225": "green",
			"299": "green"
		}
	},
	{
		"id": 202,
		"map": "asia",
		"name": "Damascus",
		"x": 2333,
		"y": 1791,
		"nation": "tu",
		"faction": "cp",
		"vp": 2,
		"area": "syria_palestine",
		"connections": [
			193,
			208,
			217
		],
		"rail_connections": [
			193,
			217
		],
		"connection_types": {
			"193": "rail",
			"208": "",
			"217": "rail",
			"219": "green"
		},
		"connection_nations": {
			"219": [
				"arab"
			]
		},
		"limited_connections": {
			"ar": [
				193,
				208,
				217,
				219
			]
		}
	},
	{
		"id": 203,
		"map": "asia",
		"name": "Amara",
		"x": 3743,
		"y": 1796,
		"nation": "tu",
		"faction": "cp",
		"terrain": "swamp",
		"area": "mesopotamia",
		"tribal_activity_grid": "Marsh",
		"connections": [
			190,
			207,
			216
		],
		"rail_connections": [],
		"connection_types": {
			"190": "",
			"207": "",
			"216": ""
		}
	},
	{
		"id": 204,
		"map": "gallipoli",
		"name": "Sari Bahr",
		"x": 249,
		"y": 1815,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "gallipoli",
		"connections": [
			188,
			199,
			210,
			218
		],
		"rail_connections": [],
		"connection_types": {
			"188": "",
			"199": "",
			"210": "strait",
			"218": ""
		}
	},
	{
		"id": 205,
		"map": "asia",
		"name": "Karbala",
		"x": 3120,
		"y": 1817,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"area": "mesopotamia",
		"connections": [
			189,
			195,
			215
		],
		"rail_connections": [],
		"connection_types": {
			"189": "",
			"195": "",
			"215": ""
		}
	},
	{
		"id": 206,
		"map": "asia",
		"name": "Hilla",
		"x": 3353,
		"y": 1837,
		"nation": "tu",
		"faction": "cp",
		"area": "mesopotamia",
		"connections": [
			194,
			195,
			222
		],
		"rail_connections": [],
		"connection_types": {
			"194": "",
			"195": "",
			"222": ""
		},
		"crossings": {
			"195": "b_to_a"
		}
	},
	{
		"id": 207,
		"map": "asia",
		"name": "Ahwaz",
		"x": 3956,
		"y": 1855,
		"nation": "br",
		"faction": "ap",
		"terrain": "desert",
		"vp": 1,
		"area": "arabistan",
		"tribal_activity_grid": "Bawi",
		"connections": [
			186,
			203,
			225
		],
		"rail_connections": [],
		"connection_types": {
			"186": "",
			"203": "",
			"225": ""
		}
	},
	{
		"id": 208,
		"map": "asia",
		"name": "Megiddo",
		"x": 2182,
		"y": 1858,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "syria_palestine",
		"connections": [
			202,
			213,
			217,
			224
		],
		"rail_connections": [
			213,
			217,
			224
		],
		"connection_types": {
			"202": "",
			"213": "rail",
			"217": "rail",
			"224": "rail"
		}
	},
	{
		"id": 209,
		"map": "asia",
		"name": "To Haifa",
		"x": 1899,
		"y": 1864,
		"nation": "br",
		"faction": "ap",
		"beach_for": "Cyprus",
		"connections": [
			183,
			213
		],
		"rail_connections": [],
		"connection_types": {
			"183": "strait",
			"213": "strait"
		},
		"crossings": {
			"213": "a_to_b"
		}
	},
	{
		"id": 210,
		"map": "gallipoli",
		"name": "Gaba Tepe",
		"x": 143,
		"y": 1867,
		"nation": "br",
		"faction": "ap",
		"beach_for": "Lemnos",
		"area": "gallipoli",
		"connections": [
			204,
			288
		],
		"rail_connections": [],
		"connection_types": {
			"204": "strait",
			"288": "strait"
		},
		"crossings": {
			"204": "b_to_a"
		}
	},
	{
		"id": 211,
		"map": "gallipoli",
		"name": "Bergaz",
		"x": 590,
		"y": 1867,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "gallipoli",
		"connections": [
			191,
			220
		],
		"rail_connections": [],
		"connection_types": {
			"191": "",
			"220": ""
		}
	},
	{
		"id": 212,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 213,
		"map": "asia",
		"name": "Haifa",
		"x": 2073,
		"y": 1898,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"port": 1,
		"area": "syria_palestine",
		"connections": [
			196,
			208,
			209,
			228
		],
		"rail_connections": [
			208
		],
		"connection_types": {
			"196": "",
			"208": "rail",
			"209": "strait",
			"228": ""
		}
	},
	{
		"id": 214,
		"map": "asia",
		"name": "The Hai",
		"x": 3605,
		"y": 1906,
		"nation": "tu",
		"faction": "cp",
		"terrain": "swamp",
		"area": "mesopotamia",
		"tribal_activity_grid": "Marsh",
		"connections": [
			198,
			229
		],
		"rail_connections": [],
		"connection_types": {
			"198": "",
			"229": ""
		},
		"crossings": {
			"198": "b_to_a"
		}
	},
	{
		"id": 215,
		"map": "asia",
		"name": "Najaf",
		"x": 3255,
		"y": 1912,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"area": "mesopotamia",
		"connections": [
			205,
			222
		],
		"rail_connections": [],
		"connection_types": {
			"205": "",
			"222": ""
		}
	},
	{
		"id": 216,
		"map": "asia",
		"name": "Qurna",
		"x": 3754,
		"y": 1923,
		"nation": "tu",
		"faction": "cp",
		"terrain": "swamp",
		"area": "mesopotamia",
		"tribal_activity_grid": "Marsh",
		"connections": [
			203,
			226,
			229
		],
		"rail_connections": [],
		"connection_types": {
			"203": "",
			"226": "",
			"229": ""
		}
	},
	{
		"id": 217,
		"map": "asia",
		"name": "Dera",
		"x": 2298,
		"y": 1928,
		"nation": "tu",
		"faction": "cp",
		"area": "syria_palestine",
		"connections": [
			202,
			208,
			236
		],
		"rail_connections": [
			202,
			208,
			236
		],
		"connection_types": {
			"202": "rail",
			"208": "rail",
			"219": "green",
			"236": "rail"
		},
		"connection_nations": {
			"219": [
				"arab"
			]
		},
		"limited_connections": {
			"ar": [
				202,
				208,
				219,
				236
			]
		}
	},
	{
		"id": 218,
		"map": "gallipoli",
		"name": "Maidos",
		"x": 351,
		"y": 1929,
		"nation": "tu",
		"faction": "cp",
		"vp": 1,
		"fort": 1,
		"area": "gallipoli",
		"connections": [
			199,
			204,
			220,
			227
		],
		"rail_connections": [],
		"connection_types": {
			"199": "",
			"204": "",
			"220": "strait",
			"227": ""
		},
		"connection_straits": {
			"220": 2
		},
		"crossings": {
			"220": "bidirectional"
		},
		"connection_flags": {
			"220": [
				"2"
			]
		}
	},
	{
		"id": 219,
		"map": "asia",
		"name": "Umtaiye",
		"x": 2409,
		"y": 1945,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"area": "syria_palestine",
		"connections": [],
		"rail_connections": [],
		"connection_types": {
			"202": "green",
			"217": "green",
			"235": "green"
		},
		"connection_nations": {
			"202": [
				"arab"
			],
			"217": [
				"arab"
			],
			"235": [
				"arab"
			]
		},
		"limited_connections": {
			"ar": [
				202,
				217,
				235
			]
		}
	},
	{
		"id": 220,
		"map": "gallipoli",
		"name": "Canakkale",
		"x": 494,
		"y": 1953,
		"nation": "tu",
		"faction": "cp",
		"vp": 1,
		"fort": 2,
		"area": "gallipoli",
		"connections": [
			211,
			218,
			232,
			233
		],
		"rail_connections": [],
		"connection_types": {
			"211": "",
			"218": "strait",
			"232": "",
			"233": ""
		},
		"connection_straits": {
			"218": 2
		},
		"crossings": {
			"218": "bidirectional"
		},
		"connection_flags": {
			"218": [
				"2"
			]
		}
	},
	{
		"id": 221,
		"map": "gallipoli",
		"name": "Cape Helles",
		"x": 142,
		"y": 1973,
		"nation": "br",
		"faction": "ap",
		"beach_for": "Lemnos",
		"area": "gallipoli",
		"connections": [
			239,
			288
		],
		"rail_connections": [],
		"connection_types": {
			"239": "strait",
			"288": "strait"
		},
		"crossings": {
			"239": "a_to_b"
		}
	},
	{
		"id": 222,
		"map": "asia",
		"name": "Diwaniyeh",
		"x": 3399,
		"y": 1979,
		"nation": "tu",
		"faction": "cp",
		"terrain": "swamp",
		"area": "mesopotamia",
		"connections": [
			206,
			215,
			230
		],
		"rail_connections": [],
		"connection_types": {
			"206": "",
			"215": "",
			"230": ""
		},
		"crossings": {
			"206": "a_to_b"
		}
	},
	{
		"id": 223,
		"map": "asia",
		"name": "To Jaffa",
		"x": 1832,
		"y": 1994,
		"nation": "br",
		"faction": "ap",
		"beach_for": "Cyprus",
		"connections": [
			183,
			228
		],
		"rail_connections": [],
		"connection_types": {
			"183": "strait",
			"228": "strait"
		},
		"crossings": {
			"228": "a_to_b"
		}
	},
	{
		"id": 224,
		"map": "asia",
		"name": "Nablus",
		"x": 2174,
		"y": 1994,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "syria_palestine",
		"connections": [
			208,
			228,
			237
		],
		"rail_connections": [
			208,
			228
		],
		"connection_types": {
			"208": "rail",
			"228": "rail",
			"237": ""
		}
	},
	{
		"id": 225,
		"map": "asia",
		"name": "Abadan",
		"x": 4045,
		"y": 2001,
		"nation": "br",
		"faction": "ap",
		"terrain": "swamp",
		"vp": 1,
		"port": 2,
		"area": "arabistan",
		"connections": [
			201,
			207,
			226,
			234,
			238
		],
		"rail_connections": [],
		"connection_types": {
			"201": "green",
			"207": "",
			"226": "",
			"234": "",
			"238": "strait"
		}
	},
	{
		"id": 226,
		"map": "asia",
		"name": "Basra",
		"x": 3834,
		"y": 2004,
		"nation": "tu",
		"faction": "cp",
		"terrain": "swamp",
		"vp": 1,
		"port": 1,
		"area": "mesopotamia",
		"connections": [
			216,
			225,
			234,
			240
		],
		"rail_connections": [],
		"connection_types": {
			"216": "",
			"225": "",
			"234": "",
			"240": ""
		}
	},
	{
		"id": 227,
		"map": "gallipoli",
		"name": "Krithia",
		"x": 254,
		"y": 2027,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "gallipoli",
		"connections": [
			218,
			239
		],
		"rail_connections": [],
		"connection_types": {
			"218": "",
			"239": ""
		}
	},
	{
		"id": 228,
		"map": "asia",
		"name": "Jaffa",
		"x": 2047,
		"y": 2029,
		"nation": "tu",
		"faction": "cp",
		"port": 1,
		"area": "syria_palestine",
		"connections": [
			213,
			223,
			224,
			237,
			241
		],
		"rail_connections": [
			224,
			237,
			241
		],
		"connection_types": {
			"213": "",
			"223": "strait",
			"224": "rail",
			"237": "rail",
			"241": "rail"
		}
	},
	{
		"id": 229,
		"map": "asia",
		"name": "Nasiriya",
		"x": 3660,
		"y": 2030,
		"nation": "tu",
		"faction": "cp",
		"terrain": "swamp",
		"area": "mesopotamia",
		"tribal_activity_grid": "Marsh",
		"connections": [
			214,
			216,
			230,
			240
		],
		"rail_connections": [],
		"connection_types": {
			"214": "",
			"216": "",
			"230": "",
			"240": ""
		}
	},
	{
		"id": 230,
		"map": "asia",
		"name": "Samawa",
		"x": 3537,
		"y": 2032,
		"nation": "tu",
		"faction": "cp",
		"terrain": "swamp",
		"area": "mesopotamia",
		"connections": [
			222,
			229
		],
		"rail_connections": [],
		"connection_types": {
			"222": "",
			"229": ""
		}
	},
	{
		"id": 231,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 232,
		"map": "gallipoli",
		"name": "Kizilkechili",
		"x": 613,
		"y": 2065,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "gallipoli",
		"connections": [
			220,
			242
		],
		"rail_connections": [],
		"connection_types": {
			"220": "",
			"242": ""
		}
	},
	{
		"id": 233,
		"map": "gallipoli",
		"name": "Ercenkeui",
		"x": 432,
		"y": 2081,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "gallipoli",
		"connections": [
			220,
			243
		],
		"rail_connections": [],
		"connection_types": {
			"220": "",
			"243": ""
		}
	},
	{
		"id": 234,
		"map": "asia",
		"name": "Fao",
		"x": 3927,
		"y": 2082,
		"nation": "tu",
		"faction": "cp",
		"terrain": "swamp",
		"fort": 1,
		"port": 1,
		"area": "mesopotamia",
		"connections": [
			225,
			226,
			290
		],
		"rail_connections": [],
		"connection_types": {
			"225": "",
			"226": "",
			"290": "strait"
		}
	},
	{
		"id": 235,
		"map": "asia",
		"name": "Azraq",
		"x": 2467,
		"y": 2096,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"area": "syria_palestine",
		"connections": [],
		"rail_connections": [],
		"connection_types": {
			"219": "green",
			"236": "green",
			"245": "green"
		},
		"connection_nations": {
			"219": [
				"arab"
			],
			"236": [
				"arab"
			],
			"245": [
				"arab"
			]
		},
		"limited_connections": {
			"ar": [
				219,
				236,
				245
			]
		}
	},
	{
		"id": 236,
		"map": "asia",
		"name": "Amman",
		"x": 2270,
		"y": 2109,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"fort": 1,
		"area": "syria_palestine",
		"connections": [
			217,
			237,
			244
		],
		"rail_connections": [
			217,
			244
		],
		"connection_types": {
			"217": "rail",
			"235": "green",
			"237": "",
			"244": "rail"
		},
		"connection_nations": {
			"235": [
				"arab"
			]
		},
		"limited_connections": {
			"ar": [
				217,
				235,
				237,
				244
			]
		}
	},
	{
		"id": 237,
		"map": "asia",
		"name": "Jerusalem",
		"x": 2132,
		"y": 2120,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"vp": 2,
		"area": "syria_palestine",
		"jihad_city": true,
		"connections": [
			224,
			228,
			236,
			249
		],
		"rail_connections": [
			228
		],
		"connection_types": {
			"224": "",
			"228": "rail",
			"236": "",
			"249": ""
		}
	},
	{
		"id": 238,
		"map": "asia",
		"name": "to Abadan",
		"x": 4087,
		"y": 2130,
		"nation": "br",
		"faction": "ap",
		"beach_for": "Bahrain",
		"connections": [
			225,
			291
		],
		"rail_connections": [],
		"connection_types": {
			"225": "strait",
			"291": "strait"
		},
		"crossings": {
			"225": "a_to_b"
		}
	},
	{
		"id": 239,
		"map": "gallipoli",
		"name": "Seddul Bahr",
		"x": 172,
		"y": 2138,
		"nation": "tu",
		"faction": "cp",
		"fort": 1,
		"area": "gallipoli",
		"connections": [
			221,
			227,
			248
		],
		"rail_connections": [],
		"connection_types": {
			"221": "strait",
			"227": "",
			"248": "strait"
		},
		"connection_straits": {
			"248": 1
		},
		"crossings": {
			"248": "bidirectional"
		},
		"connection_flags": {
			"248": [
				"1"
			]
		}
	},
	{
		"id": 240,
		"map": "asia",
		"name": "Shaiba",
		"x": 3772,
		"y": 2141,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"area": "mesopotamia",
		"connections": [
			226,
			229,
			246
		],
		"rail_connections": [],
		"connection_types": {
			"226": "",
			"229": "",
			"246": ""
		}
	},
	{
		"id": 241,
		"map": "asia",
		"name": "Gaza",
		"x": 2029,
		"y": 2176,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"fort": 2,
		"area": "syria_palestine",
		"connections": [
			228,
			249,
			251
		],
		"rail_connections": [
			228,
			249,
			251
		],
		"connection_types": {
			"228": "rail",
			"249": "rail",
			"251": "conditional_rail"
		},
		"connection_flags": {
			"251": [
				"event_xinai"
			]
		}
	},
	{
		"id": 242,
		"map": "gallipoli",
		"name": "Kizil Kaya",
		"x": 573,
		"y": 2180,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "gallipoli",
		"connections": [
			232,
			250
		],
		"rail_connections": [],
		"connection_types": {
			"232": "",
			"250": ""
		}
	},
	{
		"id": 243,
		"map": "gallipoli",
		"name": "Nalif-eli",
		"x": 366,
		"y": 2223,
		"nation": "tu",
		"faction": "cp",
		"area": "gallipoli",
		"connections": [
			233,
			248,
			250
		],
		"rail_connections": [],
		"connection_types": {
			"233": "",
			"248": "",
			"250": ""
		}
	},
	{
		"id": 244,
		"map": "asia",
		"name": "Hesa",
		"x": 2334,
		"y": 2246,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"area": "syria_palestine",
		"connections": [
			236,
			249,
			263
		],
		"rail_connections": [
			236,
			263
		],
		"connection_types": {
			"236": "rail",
			"245": "green",
			"249": "",
			"263": "rail"
		},
		"connection_nations": {
			"245": [
				"arab"
			]
		},
		"limited_connections": {
			"ar": [
				236,
				245,
				249,
				263
			]
		}
	},
	{
		"id": 245,
		"map": "asia",
		"name": "Bair",
		"x": 2527,
		"y": 2248,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"area": "syria_palestine",
		"connections": [],
		"rail_connections": [],
		"connection_types": {
			"235": "green",
			"244": "green",
			"278": "green"
		},
		"connection_nations": {
			"235": [
				"arab"
			],
			"244": [
				"arab"
			],
			"278": [
				"arab"
			]
		},
		"limited_connections": {
			"ar": [
				235,
				244,
				278
			]
		}
	},
	{
		"id": 246,
		"map": "asia",
		"name": "Kuwait",
		"x": 3886,
		"y": 2253,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"port": 1,
		"area": "mesopotamia",
		"connections": [
			240,
			252
		],
		"rail_connections": [],
		"connection_types": {
			"240": "",
			"252": "strait"
		}
	},
	{
		"id": 247,
		"map": "gallipoli",
		"name": "Besika Bay",
		"x": 106,
		"y": 2256,
		"nation": "br",
		"faction": "ap",
		"beach_for": "Lemnos",
		"area": "gallipoli",
		"connections": [
			248,
			288
		],
		"rail_connections": [],
		"connection_types": {
			"248": "strait",
			"288": "strait"
		},
		"crossings": {
			"248": "b_to_a"
		}
	},
	{
		"id": 248,
		"map": "gallipoli",
		"name": "Kum Kale",
		"x": 235,
		"y": 2260,
		"nation": "tu",
		"faction": "cp",
		"fort": 1,
		"area": "gallipoli",
		"connections": [
			239,
			243,
			247
		],
		"rail_connections": [],
		"connection_types": {
			"239": "strait",
			"243": "",
			"247": "strait"
		},
		"connection_straits": {
			"239": 1
		},
		"crossings": {
			"239": "bidirectional"
		},
		"connection_flags": {
			"239": [
				"1"
			]
		}
	},
	{
		"id": 249,
		"map": "asia",
		"name": "Beersheba",
		"x": 2126,
		"y": 2266,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"area": "syria_palestine",
		"connections": [
			237,
			241,
			244,
			261
		],
		"rail_connections": [
			241
		],
		"connection_types": {
			"237": "",
			"241": "rail",
			"244": "",
			"261": ""
		}
	},
	{
		"id": 250,
		"map": "gallipoli",
		"name": "Ezine",
		"x": 484,
		"y": 2273,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"area": "gallipoli",
		"connections": [
			112,
			242,
			243
		],
		"rail_connections": [],
		"connection_types": {
			"112": "",
			"242": "",
			"243": ""
		}
	},
	{
		"id": 251,
		"map": "asia",
		"name": "El Arish",
		"x": 1942,
		"y": 2301,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"area": "sinai",
		"connections": [
			241,
			254,
			261,
			265
		],
		"rail_connections": [
			241,
			254
		],
		"connection_types": {
			"241": "conditional_rail",
			"254": "conditional_rail",
			"261": "",
			"265": ""
		},
		"connection_flags": {
			"241": [
				"event_xinai"
			],
			"254": [
				"event_xinai"
			]
		}
	},
	{
		"id": 252,
		"map": "asia",
		"name": "to Kuwait",
		"x": 4057,
		"y": 2305,
		"nation": "br",
		"faction": "ap",
		"beach_for": "Bahrain",
		"connections": [
			246,
			291
		],
		"rail_connections": [],
		"connection_types": {
			"246": "strait",
			"291": "strait"
		},
		"crossings": {
			"246": "a_to_b"
		}
	},
	{
		"id": 253,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 254,
		"map": "asia",
		"name": "Romani",
		"x": 1809,
		"y": 2324,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"area": "sinai",
		"connections": [
			251,
			255,
			262,
			265
		],
		"rail_connections": [
			251,
			262
		],
		"connection_types": {
			"251": "conditional_rail",
			"255": "",
			"262": "conditional_rail",
			"265": ""
		},
		"crossings": {
			"255": "bidirectional",
			"262": "bidirectional"
		},
		"connection_flags": {
			"251": [
				"event_xinai"
			],
			"262": [
				"event_xinai"
			]
		}
	},
	{
		"id": 255,
		"map": "asia",
		"name": "Port Said",
		"x": 1657,
		"y": 2287,
		"nation": "br",
		"faction": "ap",
		"vp": 1,
		"port": 2,
		"area": "egypt",
		"connections": [
			254,
			262
		],
		"rail_connections": [
			262
		],
		"connection_types": {
			"254": "",
			"262": "rail"
		},
		"crossings": {
			"254": "bidirectional"
		}
	},
	{
		"id": 256,
		"map": "asia",
		"name": "Alexandria",
		"x": 1355,
		"y": 2373,
		"nation": "br",
		"faction": "ap",
		"vp": 1,
		"port": 2,
		"area": "egypt",
		"connections": [
			257,
			264,
			268
		],
		"rail_connections": [
			257,
			264,
			268
		],
		"connection_types": {
			"257": "rail",
			"264": "rail",
			"268": "rail"
		}
	},
	{
		"id": 257,
		"map": "asia",
		"name": "Zagazig",
		"x": 1569,
		"y": 2383,
		"nation": "br",
		"faction": "ap",
		"area": "egypt",
		"connections": [
			256,
			262,
			268
		],
		"rail_connections": [
			256,
			262,
			268
		],
		"connection_types": {
			"256": "rail",
			"262": "rail",
			"268": "rail"
		}
	},
	{
		"id": 258,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 259,
		"map": "asia",
		"name": "Sollum",
		"x": 837,
		"y": 2396,
		"nation": "br",
		"faction": "ap",
		"terrain": "desert",
		"vp": 1,
		"port": 2,
		"area": "egypt",
		"tribal_activity_grid": "Senussi",
		"connections": [
			260,
			275
		],
		"rail_connections": [],
		"connection_types": {
			"260": "",
			"275": ""
		}
	},
	{
		"id": 260,
		"map": "asia",
		"name": "Sidi Barrani",
		"x": 980,
		"y": 2398,
		"nation": "br",
		"faction": "ap",
		"terrain": "desert",
		"area": "egypt",
		"connections": [
			259,
			264
		],
		"rail_connections": [],
		"connection_types": {
			"259": "",
			"264": ""
		}
	},
	{
		"id": 261,
		"map": "asia",
		"name": "Kossaima",
		"x": 2052,
		"y": 2407,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"area": "sinai",
		"connections": [
			249,
			251,
			265,
			270
		],
		"rail_connections": [],
		"connection_types": {
			"249": "",
			"251": "",
			"265": "",
			"270": ""
		}
	},
	{
		"id": 262,
		"map": "asia",
		"name": "Ismailia",
		"x": 1689,
		"y": 2405,
		"nation": "br",
		"faction": "ap",
		"vp": 1,
		"port": 2,
		"area": "egypt",
		"connections": [
			254,
			255,
			257,
			265,
			269
		],
		"rail_connections": [
			254,
			255,
			257,
			269
		],
		"connection_types": {
			"254": "conditional_rail",
			"255": "rail",
			"257": "rail",
			"265": "",
			"269": "rail"
		},
		"crossings": {
			"254": "bidirectional",
			"265": "bidirectional"
		},
		"connection_flags": {
			"254": [
				"event_xinai"
			]
		}
	},
	{
		"id": 263,
		"map": "asia",
		"name": "Maan",
		"x": 2342,
		"y": 2409,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"vp": 1,
		"fort": 1,
		"area": "syria_palestine",
		"connections": [
			244,
			271
		],
		"rail_connections": [
			244
		],
		"connection_types": {
			"244": "rail",
			"271": "",
			"272": "rail"
		},
		"connection_nations": {
			"272": [
				"arab_and_tu"
			]
		},
		"limited_connections": {
			"ar": [
				244,
				271,
				272
			],
			"tu": [
				244,
				271,
				272
			],
			"tua": [
				244,
				271,
				272
			]
		}
	},
	{
		"id": 264,
		"map": "asia",
		"name": "Mersa Matruh",
		"x": 1172,
		"y": 2411,
		"nation": "br",
		"faction": "ap",
		"terrain": "desert",
		"port": 2,
		"area": "egypt",
		"connections": [
			256,
			260,
			266,
			273
		],
		"rail_connections": [
			256
		],
		"connection_types": {
			"256": "rail",
			"260": "",
			"266": "",
			"273": ""
		}
	},
	{
		"id": 265,
		"map": "asia",
		"name": "Jifjaffa",
		"x": 1831,
		"y": 2424,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"area": "sinai",
		"connections": [
			251,
			254,
			261,
			262,
			270
		],
		"rail_connections": [],
		"connection_types": {
			"251": "",
			"254": "",
			"261": "",
			"262": "",
			"270": ""
		},
		"crossings": {
			"262": "bidirectional"
		}
	},
	{
		"id": 266,
		"map": "asia",
		"name": "Gara",
		"x": 1099,
		"y": 2504,
		"nation": "br",
		"faction": "ap",
		"terrain": "desert",
		"area": "egypt",
		"connections": [
			264,
			275
		],
		"rail_connections": [],
		"connection_types": {
			"264": "",
			"273": "",
			"275": ""
		},
		"connection_nations": {
			"273": [
				"s"
			]
		},
		"limited_connections": {
			"senussi": [
				264,
				273,
				275
			]
		}
	},
	{
		"id": 267,
		"map": "asia",
		"name": "Faiyum",
		"x": 1388,
		"y": 2515,
		"nation": "br",
		"faction": "ap",
		"terrain": "desert",
		"area": "egypt",
		"connections": [],
		"rail_connections": [],
		"connection_types": {
			"268": "",
			"273": "",
			"300": ""
		},
		"connection_nations": {
			"268": [
				"s"
			],
			"273": [
				"s"
			],
			"300": [
				"s"
			]
		},
		"limited_connections": {
			"senussi": [
				268,
				273,
				300
			]
		}
	},
	{
		"id": 268,
		"map": "asia",
		"name": "CAIRO",
		"x": 1566,
		"y": 2524,
		"nation": "br",
		"faction": "ap",
		"vp": 2,
		"area": "egypt",
		"jihad_city": true,
		"connections": [
			256,
			257,
			269
		],
		"rail_connections": [
			256,
			257,
			269
		],
		"connection_types": {
			"256": "rail",
			"257": "rail",
			"267": "",
			"269": "rail",
			"300": "rail"
		},
		"connection_nations": {
			"267": [
				"s"
			],
			"300": [
				"ap"
			]
		},
		"limited_connections": {
			"anz": [
				256,
				257,
				269,
				300
			],
			"ar": [
				256,
				257,
				269,
				300
			],
			"arm": [
				256,
				257,
				269,
				300
			],
			"br": [
				256,
				257,
				269,
				300
			],
			"fr": [
				256,
				257,
				269,
				300
			],
			"gr": [
				256,
				257,
				269,
				300
			],
			"in": [
				256,
				257,
				269,
				300
			],
			"it": [
				256,
				257,
				269,
				300
			],
			"ro": [
				256,
				257,
				269,
				300
			],
			"ru": [
				256,
				257,
				269,
				300
			],
			"sb": [
				256,
				257,
				269,
				300
			],
			"senussi": [
				256,
				257,
				267,
				269
			]
		}
	},
	{
		"id": 269,
		"map": "asia",
		"name": "Suez",
		"x": 1717,
		"y": 2538,
		"nation": "br",
		"faction": "ap",
		"vp": 1,
		"port": 2,
		"area": "egypt",
		"connections": [
			262,
			268,
			270
		],
		"rail_connections": [
			262,
			268
		],
		"connection_types": {
			"262": "rail",
			"268": "rail",
			"270": ""
		},
		"crossings": {
			"270": "bidirectional"
		}
	},
	{
		"id": 270,
		"map": "asia",
		"name": "Nekhi",
		"x": 1854,
		"y": 2536,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"area": "sinai",
		"connections": [
			261,
			265,
			269
		],
		"rail_connections": [],
		"connection_types": {
			"261": "",
			"265": "",
			"269": ""
		},
		"crossings": {
			"269": "bidirectional"
		}
	},
	{
		"id": 271,
		"map": "asia",
		"name": "Aqaba",
		"x": 2141,
		"y": 2537,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"fort": 1,
		"port": 1,
		"area": "syria_palestine",
		"connections": [
			263
		],
		"rail_connections": [],
		"connection_types": {
			"263": "",
			"276": ""
		},
		"connection_nations": {
			"276": [
				"arab_and_tu"
			]
		},
		"limited_connections": {
			"ar": [
				263,
				276
			],
			"tu": [
				263,
				276
			],
			"tua": [
				263,
				276
			]
		}
	},
	{
		"id": 272,
		"map": "asia",
		"name": "Tabuk",
		"x": 2374,
		"y": 2554,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"area": "syria_palestine",
		"connections": [],
		"rail_connections": [],
		"connection_types": {
			"263": "rail",
			"277": "rail"
		},
		"connection_nations": {
			"263": [
				"arab_and_tu"
			],
			"277": [
				"arab_and_tu"
			]
		},
		"limited_connections": {
			"ar": [
				263,
				277
			],
			"tu": [
				263,
				277
			],
			"tua": [
				263,
				277
			]
		}
	},
	{
		"id": 273,
		"map": "asia",
		"name": "Bahariya Oasis",
		"x": 1231,
		"y": 2564,
		"nation": "br",
		"faction": "ap",
		"terrain": "desert",
		"area": "egypt",
		"tribal_activity_grid": "Senussi",
		"connections": [
			264
		],
		"rail_connections": [],
		"connection_types": {
			"264": "",
			"266": "",
			"267": "",
			"275": ""
		},
		"connection_nations": {
			"266": [
				"s"
			],
			"267": [
				"s"
			],
			"275": [
				"s"
			]
		},
		"limited_connections": {
			"senussi": [
				264,
				266,
				267,
				275
			]
		}
	},
	{
		"id": 274,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 275,
		"map": "asia",
		"name": "Siwa Oasis",
		"x": 1007,
		"y": 2616,
		"nation": "br",
		"faction": "ap",
		"terrain": "desert",
		"area": "egypt",
		"tribal_activity_grid": "Senussi",
		"connections": [
			259,
			266
		],
		"rail_connections": [],
		"connection_types": {
			"259": "",
			"266": "",
			"273": ""
		},
		"connection_nations": {
			"273": [
				"s"
			]
		},
		"limited_connections": {
			"senussi": [
				259,
				266,
				273
			]
		}
	},
	{
		"id": 276,
		"map": "asia",
		"name": "Yenbo",
		"x": 2145,
		"y": 2677,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"area": "syria_palestine",
		"connections": [],
		"rail_connections": [],
		"connection_types": {
			"271": "",
			"280": ""
		},
		"connection_nations": {
			"271": [
				"arab_and_tu"
			],
			"280": [
				"arab_and_tu"
			]
		},
		"limited_connections": {
			"ar": [
				271,
				280
			],
			"tu": [
				271,
				280
			],
			"tua": [
				271,
				280
			]
		}
	},
	{
		"id": 277,
		"map": "asia",
		"name": "Medina",
		"x": 2454,
		"y": 2685,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"vp": 1,
		"fort": 3,
		"area": "syria_palestine",
		"jihad_city": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {
			"272": "rail",
			"278": "",
			"280": ""
		},
		"connection_nations": {
			"272": [
				"arab_and_tu"
			],
			"278": [
				"arab_and_tu"
			],
			"280": [
				"arab_and_tu"
			]
		},
		"limited_connections": {
			"ar": [
				272,
				278,
				280
			],
			"tu": [
				272,
				278,
				280
			],
			"tua": [
				272,
				278,
				280
			]
		}
	},
	{
		"id": 278,
		"map": "asia",
		"name": "Mecca",
		"x": 2610,
		"y": 2716,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"vp": 1,
		"region": "hejaz",
		"area": "syria_palestine",
		"jihad_city": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {
			"245": "green",
			"277": "",
			"280": ""
		},
		"connection_nations": {
			"245": [
				"arab"
			],
			"277": [
				"arab_and_tu"
			],
			"280": [
				"arab_and_tu"
			]
		},
		"limited_connections": {
			"ar": [
				245,
				277,
				280
			],
			"tu": [
				277,
				280
			],
			"tua": [
				277,
				280
			]
		}
	},
	{
		"id": 279,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 280,
		"map": "asia",
		"name": "Jiddah",
		"x": 2314,
		"y": 2763,
		"nation": "tu",
		"faction": "cp",
		"terrain": "desert",
		"port": 1,
		"area": "syria_palestine",
		"connections": [],
		"rail_connections": [],
		"connection_types": {
			"276": "",
			"277": "",
			"278": ""
		},
		"connection_nations": {
			"276": [
				"arab_and_tu"
			],
			"277": [
				"arab_and_tu"
			],
			"278": [
				"arab_and_tu"
			]
		},
		"limited_connections": {
			"ar": [
				276,
				277,
				278
			],
			"tu": [
				276,
				277,
				278
			],
			"tua": [
				276,
				277,
				278
			]
		}
	},
	{
		"id": 281,
		"map": "Reserve Box",
		"name": "AP Eliminated",
		"x": 1711,
		"y": 2707,
		"faction": "ap",
		"area": "egypt",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 282,
		"map": "Reserve Box",
		"name": "AP Reserve",
		"x": 976,
		"y": 2098,
		"faction": "ap",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 283,
		"map": "asia",
		"name": "Central Asia",
		"x": 4216,
		"y": 383,
		"nation": "ru",
		"faction": "ap",
		"vp": 1,
		"port": 2,
		"region": "central asia",
		"area": "central_asia",
		"connections": [
			292,
			298
		],
		"rail_connections": [],
		"connection_types": {
			"23": "green",
			"78": "green",
			"292": "green",
			"298": "green"
		},
		"crossings": {
			"23": "bidirectional",
			"78": "bidirectional"
		},
		"connection_nations": {
			"23": [
				"no_tribe"
			],
			"78": [
				"no_tribe"
			]
		},
		"limited_connections": {
			"anz": [
				23,
				78,
				292,
				298
			],
			"ar": [
				23,
				78,
				292,
				298
			],
			"arm": [
				23,
				78,
				292,
				298
			],
			"br": [
				23,
				78,
				292,
				298
			],
			"fr": [
				23,
				78,
				292,
				298
			],
			"gr": [
				23,
				78,
				292,
				298
			],
			"in": [
				23,
				78,
				292,
				298
			],
			"it": [
				23,
				78,
				292,
				298
			],
			"ro": [
				23,
				78,
				292,
				298
			],
			"ru": [
				23,
				78,
				292,
				298
			],
			"sb": [
				23,
				78,
				292,
				298
			],
			"ah": [
				23,
				78,
				292,
				298
			],
			"bu": [
				23,
				78,
				292,
				298
			],
			"ge": [
				23,
				78,
				292,
				298
			],
			"geo": [
				23,
				78,
				292,
				298
			],
			"pe": [
				23,
				78,
				292,
				298
			],
			"re": [
				23,
				78,
				292,
				298
			],
			"tu": [
				23,
				78,
				292,
				298
			],
			"tua": [
				23,
				78,
				292,
				298
			]
		}
	},
	{
		"id": 284,
		"map": "Reserve Box",
		"name": "CP Corps Assets",
		"x": 888,
		"y": 1770,
		"faction": "cp",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 285,
		"map": "Reserve Box",
		"name": "CP Eliminated",
		"x": 2258,
		"y": 227,
		"faction": "cp",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 286,
		"map": "Reserve Box",
		"name": "CP Reserve",
		"x": 1222,
		"y": 1770,
		"faction": "cp",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 287,
		"map": "asia",
		"name": "The Bosphorus Forts",
		"x": 1189,
		"y": 719,
		"nation": "tu",
		"faction": "cp",
		"terrain": "mountain",
		"vp": 1,
		"fort": 3,
		"port": 1,
		"area": "anatolia",
		"connections": [
			65,
			82
		],
		"rail_connections": [
			65,
			82
		],
		"connection_types": {
			"65": "rail",
			"82": "rail"
		}
	},
	{
		"id": 288,
		"map": "asia",
		"name": "Lemnos",
		"x": 637,
		"y": 1004,
		"nation": "br",
		"faction": "ap",
		"port": 2,
		"island_base": "Lemnos",
		"area": "balkans",
		"connections": [
			113,
			126,
			136,
			197,
			210,
			221,
			247
		],
		"rail_connections": [],
		"connection_types": {
			"113": "strait",
			"126": "strait",
			"136": "strait",
			"197": "strait",
			"210": "strait",
			"221": "strait",
			"247": "strait"
		}
	},
	{
		"id": 289,
		"map": "asia",
		"name": "Samsun",
		"x": 1983,
		"y": 551,
		"nation": "tu",
		"faction": "cp",
		"port": 1,
		"area": "anatolia",
		"connections": [
			48,
			68
		],
		"rail_connections": [],
		"connection_types": {
			"48": "",
			"68": ""
		}
	},
	{
		"id": 290,
		"map": "asia",
		"name": "to Fao",
		"x": 4024,
		"y": 2207,
		"nation": "br",
		"faction": "ap",
		"beach_for": "Bahrain",
		"connections": [
			234,
			291
		],
		"rail_connections": [],
		"connection_types": {
			"234": "strait",
			"291": "strait"
		},
		"crossings": {
			"234": "a_to_b"
		}
	},
	{
		"id": 291,
		"map": "asia",
		"name": "Bahrain",
		"x": 4216,
		"y": 2298,
		"nation": "br",
		"faction": "ap",
		"island_base": true,
		"connections": [
			238,
			252,
			290
		],
		"rail_connections": [],
		"connection_types": {
			"238": "strait",
			"252": "strait",
			"290": "strait"
		}
	},
	{
		"id": 292,
		"map": "asia",
		"name": "Meshed",
		"x": 4082,
		"y": 922,
		"nation": "pe",
		"faction": "ap",
		"terrain": "mountain",
		"vp": 1,
		"region": "east persia",
		"area": "persia",
		"tribal_activity_grid": "Qashqai",
		"connections": [
			122,
			174,
			283,
			298
		],
		"rail_connections": [],
		"connection_types": {
			"122": "green",
			"174": "green",
			"283": "green",
			"298": "green"
		}
	},
	{
		"id": 293,
		"map": "Reserve Box",
		"name": "AP Corps Assets",
		"x": 1310,
		"y": 2098,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 294,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 295,
		"map": "asia",
		"name": "Odessa",
		"x": 1259,
		"y": 166,
		"nation": "ru",
		"faction": "ap",
		"region": "odessa",
		"area": "balkans",
		"connections": [],
		"rail_connections": [],
		"connection_types": {
			"3": "rail"
		},
		"connection_nations": {
			"3": [
				"ru"
			]
		},
		"limited_connections": {
			"ru": [
				3
			]
		}
	},
	{
		"id": 296,
		"map": "asia",
		"name": "Galicia",
		"x": 128,
		"y": 102,
		"nation": "ah",
		"faction": "cp",
		"region": "galicia",
		"area": "balkans",
		"connections": [],
		"rail_connections": [],
		"connection_types": {
			"4": "rail",
			"6": "rail",
			"17": "rail"
		},
		"crossings": {
			"17": "b_to_a"
		},
		"connection_nations": {
			"4": [
				"cp"
			],
			"6": [
				"cp"
			],
			"17": [
				"cp"
			]
		},
		"limited_connections": {
			"ah": [
				4,
				6,
				17
			],
			"arm": [
				4,
				6,
				17
			],
			"bu": [
				4,
				6,
				17
			],
			"ge": [
				4,
				6,
				17
			],
			"geo": [
				4,
				6,
				17
			],
			"pe": [
				4,
				6,
				17
			],
			"re": [
				4,
				6,
				17
			],
			"tr": [
				4,
				6,
				17
			],
			"tu": [
				4,
				6,
				17
			],
			"tua": [
				4,
				6,
				17
			]
		}
	},
	{
		"id": 297,
		"map": "asia",
		"name": "Petrovsk",
		"x": 3270,
		"y": 166,
		"nation": "ru",
		"faction": "ap",
		"region": "petrovsk",
		"area": "russia",
		"connections": [],
		"rail_connections": [],
		"connection_types": {
			"9": "rail"
		},
		"connection_nations": {
			"9": [
				"ru"
			]
		},
		"limited_connections": {
			"ru": [
				9
			]
		}
	},
	{
		"id": 298,
		"map": "asia",
		"name": "Afghanistan",
		"x": 4216,
		"y": 660,
		"nation": "tu",
		"faction": "neutral",
		"terrain": "mountain",
		"region": "afghanistan",
		"area": "persia",
		"connections": [
			283,
			292,
			299,
			313
		],
		"rail_connections": [],
		"connection_types": {
			"283": "green",
			"292": "green",
			"299": "green",
			"313": "green"
		}
	},
	{
		"id": 299,
		"map": "asia",
		"name": "Baluchistan",
		"x": 4285,
		"y": 1770,
		"nation": "br",
		"faction": "ap",
		"port": 2,
		"region": "baluchistan",
		"connections": [
			201,
			298,
			313
		],
		"rail_connections": [],
		"connection_types": {
			"201": "green",
			"298": "green",
			"313": "green"
		}
	},
	{
		"id": 300,
		"map": "asia",
		"name": "Khartoum",
		"x": 1389,
		"y": 2738,
		"nation": "br",
		"faction": "ap",
		"terrain": "desert",
		"vp": 1,
		"port": 2,
		"region": "sudan and darfur",
		"area": "egypt",
		"connections": [],
		"rail_connections": [],
		"connection_types": {
			"267": "",
			"268": "rail"
		},
		"connection_nations": {
			"267": [
				"s"
			],
			"268": [
				"ap"
			]
		},
		"limited_connections": {
			"anz": [
				268
			],
			"ar": [
				268
			],
			"arm": [
				268
			],
			"br": [
				268
			],
			"fr": [
				268
			],
			"gr": [
				268
			],
			"in": [
				268
			],
			"it": [
				268
			],
			"ro": [
				268
			],
			"ru": [
				268
			],
			"sb": [
				268
			],
			"senussi": [
				267
			]
		}
	},
	{
		"id": 301,
		"map": "Reserve Box",
		"name": "Bakhtiari",
		"x": 3589,
		"y": 144,
		"nation": "tu",
		"faction": "cp",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 302,
		"map": "Reserve Box",
		"name": "Kurds",
		"x": 3687,
		"y": 143,
		"nation": "tu",
		"faction": "cp",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 303,
		"map": "Reserve Box",
		"name": "Senussi",
		"x": 3787,
		"y": 142,
		"nation": "tu",
		"faction": "cp",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 304,
		"map": "Reserve Box",
		"name": "Bawi",
		"x": 3885,
		"y": 142,
		"nation": "tu",
		"faction": "cp",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 305,
		"map": "Reserve Box",
		"name": "Laz",
		"x": 3984,
		"y": 142,
		"nation": "tu",
		"faction": "cp",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 306,
		"map": "Reserve Box",
		"name": "Qashqai",
		"x": 4082,
		"y": 142,
		"nation": "tu",
		"faction": "cp",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 307,
		"map": "Reserve Box",
		"name": "Tangistani",
		"x": 4182,
		"y": 142,
		"nation": "tu",
		"faction": "cp",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 308,
		"map": "Reserve Box",
		"name": "Marsh",
		"x": 4280,
		"y": 142,
		"nation": "tu",
		"faction": "cp",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 309,
		"map": "Reserve Box",
		"name": "NW Frontier",
		"x": 3789,
		"y": 277,
		"nation": "tu",
		"faction": "cp",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 310,
		"map": "Reserve Box",
		"name": "Jangali",
		"x": 3899,
		"y": 277,
		"nation": "tu",
		"faction": "cp",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 311,
		"map": "Reserve Box",
		"name": "Sinjabi",
		"x": 3998,
		"y": 277,
		"nation": "tu",
		"faction": "cp",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 312,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 313,
		"map": "asia",
		"name": "INDIA",
		"x": 4284,
		"y": 1107,
		"nation": "in",
		"faction": "ap",
		"terrain": "mountain",
		"vp": 2,
		"port": 2,
		"region": "india",
		"area": "india",
		"tribal_activity_grid": "NW Frontier",
		"connections": [
			298,
			299
		],
		"rail_connections": [],
		"connection_types": {
			"298": "green",
			"299": "green"
		}
	},
	{
		"id": 314,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 315,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 316,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 317,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 318,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 319,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 320,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 321,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 322,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 323,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 324,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 325,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 326,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 327,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 328,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 329,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 330,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 331,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 332,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 333,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 334,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 335,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 336,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 337,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 338,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 339,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 340,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 341,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 342,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 343,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 344,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 345,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 346,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 347,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 348,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 349,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 350,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 351,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 352,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 353,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 354,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 355,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 356,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 357,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 358,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 359,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 360,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 361,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 362,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 363,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 364,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 365,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 366,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 367,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 368,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 369,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 370,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 371,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 372,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 373,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 374,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 375,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 376,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 377,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 378,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 379,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 380,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 381,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 382,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 383,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 384,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 385,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 386,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 387,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 388,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 389,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 390,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 391,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 392,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 393,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 394,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 395,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 396,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 397,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 398,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 399,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 400,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 401,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 402,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 403,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 404,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 405,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 406,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 407,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 408,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 409,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 410,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 411,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 412,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 413,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 414,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 415,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 416,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 417,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 418,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 419,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 420,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 421,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 422,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 423,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 424,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 425,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 426,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 427,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 428,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 429,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 430,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 431,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 432,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 433,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 434,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 435,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 436,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 437,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 438,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 439,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 440,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 441,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 442,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 443,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 444,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 445,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 446,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 447,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 448,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 449,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 450,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 451,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 452,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 453,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 454,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 455,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 456,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 457,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 458,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 459,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 460,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 461,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 462,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 463,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 464,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 465,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 466,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 467,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 468,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 469,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 470,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 471,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 472,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 473,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 474,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 475,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 476,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 477,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 478,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 479,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 480,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 481,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 482,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 483,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 484,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 485,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 486,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 487,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 488,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 489,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 490,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 491,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 492,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 493,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 494,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 495,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 496,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 497,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 498,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 499,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 500,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 501,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 502,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 503,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 504,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 505,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 506,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 507,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 508,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 509,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 510,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 511,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 512,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 513,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 514,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 515,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 516,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 517,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 518,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 519,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 520,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 521,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 522,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 523,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 524,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 525,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 526,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 527,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 528,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 529,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 530,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 531,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 532,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 533,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 534,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 535,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 536,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 537,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 538,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 539,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 540,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 541,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 542,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 543,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 544,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 545,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 546,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 547,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 548,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 549,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 550,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 551,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 552,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 553,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 554,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 555,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 556,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 557,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 558,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 559,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 560,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 561,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 562,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 563,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 564,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 565,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 566,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 567,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 568,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 569,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 570,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 571,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 572,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 573,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 574,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 575,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 576,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 577,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 578,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 579,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 580,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 581,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 582,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 583,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 584,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 585,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 586,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 587,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 588,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 589,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 590,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 591,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 592,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 593,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 594,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 595,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 596,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 597,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 598,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 599,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 600,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 601,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 602,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 603,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 604,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 605,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 606,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 607,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 608,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 609,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 610,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 611,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 612,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 613,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 614,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 615,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 616,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 617,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 618,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 619,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 620,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 621,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 622,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 623,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 624,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 625,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 626,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 627,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 628,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 629,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 630,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 631,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 632,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 633,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 634,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 635,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 636,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 637,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 638,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 639,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 640,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 641,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 642,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 643,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 644,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 645,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 646,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 647,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 648,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 649,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 650,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 651,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 652,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 653,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 654,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 655,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 656,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 657,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 658,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 659,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 660,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 661,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 662,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 663,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 664,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 665,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 666,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 667,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 668,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 669,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 670,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 671,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 672,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 673,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 674,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 675,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 676,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 677,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 678,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 679,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 680,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 681,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 682,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 683,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 684,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 685,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 686,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 687,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 688,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 689,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 690,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 691,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 692,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 693,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 694,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 695,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 696,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 697,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 698,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 699,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 700,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 701,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 702,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 703,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 704,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 705,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 706,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 707,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 708,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 709,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 710,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 711,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 712,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 713,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 714,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 715,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 716,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 717,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 718,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 719,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 720,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 721,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 722,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 723,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 724,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 725,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 726,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 727,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 728,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 729,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 730,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 731,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 732,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 733,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 734,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 735,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 736,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 737,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 738,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 739,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 740,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 741,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 742,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 743,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 744,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 745,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 746,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 747,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 748,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 749,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 750,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 751,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 752,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 753,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 754,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 755,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 756,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 757,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 758,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 759,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 760,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 761,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 762,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 763,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 764,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 765,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 766,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 767,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 768,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 769,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 770,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 771,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 772,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 773,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 774,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 775,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 776,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 777,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 778,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 779,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 780,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 781,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 782,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 783,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 784,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 785,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 786,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 787,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 788,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 789,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 790,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 791,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 792,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 793,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 794,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 795,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 796,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 797,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 798,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 799,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 800,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 801,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 802,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 803,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 804,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 805,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 806,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 807,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 808,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 809,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 810,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 811,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 812,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 813,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 814,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 815,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 816,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 817,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 818,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 819,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 820,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 821,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 822,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 823,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 824,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 825,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 826,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 827,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 828,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 829,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 830,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 831,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 832,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 833,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 834,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 835,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 836,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 837,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 838,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 839,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 840,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 841,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 842,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 843,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 844,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 845,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 846,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 847,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 848,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 849,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 850,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 851,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 852,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 853,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 854,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 855,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 856,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 857,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 858,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 859,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 860,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 861,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 862,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 863,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 864,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 865,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 866,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 867,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 868,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 869,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 870,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 871,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 872,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 873,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 874,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 875,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 876,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 877,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 878,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 879,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 880,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 881,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 882,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 883,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 884,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 885,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 886,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 887,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 888,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 889,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 890,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 891,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 892,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 893,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 894,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 895,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 896,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 897,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 898,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 899,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 900,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 901,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 902,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 903,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 904,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 905,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 906,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 907,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 908,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 909,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 910,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 911,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 912,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 913,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 914,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 915,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 916,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 917,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 918,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 919,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 920,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 921,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 922,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 923,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 924,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 925,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 926,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 927,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 928,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 929,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 930,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 931,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 932,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 933,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 934,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 935,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 936,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 937,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 938,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 939,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 940,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 941,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 942,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 943,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 944,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 945,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 946,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 947,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 948,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 949,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 950,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 951,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 952,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 953,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 954,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 955,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 956,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 957,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 958,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 959,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 960,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 961,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 962,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 963,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 964,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 965,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 966,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 967,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 968,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 969,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 970,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 971,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 972,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 973,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 974,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 975,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 976,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 977,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 978,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 979,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 980,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 981,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 982,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 983,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 984,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 985,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 986,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 987,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 988,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 989,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 990,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 991,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 992,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 993,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 994,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 995,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 996,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 997,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 998,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 999,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1000,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1001,
		"card": 2,
		"name": "ANZ Elite DIV",
		"x": 82,
		"y": 137,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1002,
		"card": 2,
		"name": "ANZ Cavalry #1",
		"x": 151,
		"y": 137,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1003,
		"card": 8,
		"name": "BR Persian Cordon #1",
		"x": 255,
		"y": 137,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1004,
		"card": 9,
		"name": "RU Elite DIV #3",
		"x": 384,
		"y": 137,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1005,
		"card": 9,
		"name": "RU DIV #11 #12",
		"x": 453,
		"y": 138,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1006,
		"card": 10,
		"name": "RU IV Caucasian",
		"x": 565,
		"y": 145,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1007,
		"card": 10,
		"name": "RU Elite DIV #4",
		"x": 640,
		"y": 138,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1008,
		"card": 10,
		"name": "RU DIV #13",
		"x": 709,
		"y": 138,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1009,
		"card": 10,
		"name": "RU Cavalry #7",
		"x": 777,
		"y": 138,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1010,
		"card": 11,
		"name": "Max TU RP",
		"x": 890,
		"y": 145,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1011,
		"card": 12,
		"name": "Beachhead #2",
		"x": 88,
		"y": 263,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1012,
		"card": 13,
		"name": "BR Elite DIV #1 #2",
		"x": 207,
		"y": 256,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1013,
		"card": 14,
		"name": "Kitch.token",
		"x": 321,
		"y": 263,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1014,
		"card": 16,
		"name": "Arab Revolt #1 #2",
		"x": 436,
		"y": 256,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1015,
		"card": 16,
		"name": "Arab faisal Revolt",
		"x": 505,
		"y": 256,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1016,
		"card": 17,
		"name": "RU 2/4 Special",
		"x": 609,
		"y": 256,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1017,
		"card": 17,
		"name": "IT DIV",
		"x": 679,
		"y": 256,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1018,
		"card": 17,
		"name": "GR National Defense",
		"x": 747,
		"y": 256,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1019,
		"card": 19,
		"name": "ANZ Imp Camel",
		"x": 850,
		"y": 256,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1020,
		"card": 19,
		"name": "ANZ Cavalry #2",
		"x": 919,
		"y": 256,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1021,
		"card": 19,
		"name": "SINAI RAILROAD",
		"x": 994,
		"y": 263,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1022,
		"card": 22,
		"name": "BR IX Corps",
		"x": 89,
		"y": 382,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1023,
		"card": 22,
		"name": "BR Elite DIV #3",
		"x": 166,
		"y": 376,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1024,
		"card": 22,
		"name": "BR DIV #2 #3",
		"x": 234,
		"y": 376,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1025,
		"card": 22,
		"name": "BR Cavalry #1",
		"x": 302,
		"y": 376,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1026,
		"card": 22,
		"name": "Beachhead #3",
		"x": 378,
		"y": 382,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1027,
		"card": 23,
		"name": "RU DIV #14",
		"x": 489,
		"y": 376,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1028,
		"card": 23,
		"name": "RU Cavalry #8",
		"x": 558,
		"y": 376,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1029,
		"card": 23,
		"name": "RU Baratov HQ",
		"x": 627,
		"y": 376,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1030,
		"card": 23,
		"name": "RU/PE Police North",
		"x": 695,
		"y": 376,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1031,
		"card": 23,
		"name": "BR Persian Cordon #2 #3 #4",
		"x": 764,
		"y": 376,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1032,
		"card": 24,
		"name": "SB 1 Army",
		"x": 89,
		"y": 503,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1033,
		"card": 24,
		"name": "SB 2 Army",
		"x": 173,
		"y": 503,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1034,
		"card": 24,
		"name": "SB 3 Army",
		"x": 257,
		"y": 503,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1035,
		"card": 24,
		"name": "SB DIV #1 #2 #3 #4 #5 #6",
		"x": 333,
		"y": 495,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1036,
		"card": 24,
		"name": "SB Cavalry",
		"x": 401,
		"y": 495,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1037,
		"card": 25,
		"name": "RU V Caucasian",
		"x": 513,
		"y": 503,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1038,
		"card": 25,
		"name": "RU Black Sea",
		"x": 590,
		"y": 495,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1039,
		"card": 25,
		"name": "RU Elite DIV #5",
		"x": 658,
		"y": 495,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1040,
		"card": 26,
		"name": "IN Tigris Corps",
		"x": 770,
		"y": 503,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1041,
		"card": 26,
		"name": "IN 2nd Corps",
		"x": 854,
		"y": 503,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1042,
		"card": 26,
		"name": "IN DIV #7",
		"x": 931,
		"y": 495,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1043,
		"card": 27,
		"name": "BR Elite DIV #4 #5 #6",
		"x": 80,
		"y": 615,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1044,
		"card": 28,
		"name": "BR Maude HQ",
		"x": 185,
		"y": 615,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1045,
		"card": 28,
		"name": "IN 15th DIV",
		"x": 254,
		"y": 615,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1046,
		"card": 30,
		"name": "BR VIII Corps",
		"x": 366,
		"y": 624,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1047,
		"card": 30,
		"name": "ANZ ANZAC",
		"x": 450,
		"y": 624,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1048,
		"card": 30,
		"name": "BR DIV #4",
		"x": 525,
		"y": 615,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1049,
		"card": 30,
		"name": "FR DIV #1 #2",
		"x": 594,
		"y": 615,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1050,
		"card": 30,
		"name": "Beachhead #4 #5",
		"x": 670,
		"y": 623,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1051,
		"card": 32,
		"name": "Armenian Uprising",
		"x": 783,
		"y": 615,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1052,
		"card": 32,
		"name": "Armenian Uprising token #1 #2 #3",
		"x": 858,
		"y": 623,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1053,
		"card": 33,
		"name": "BR Cavalry #2",
		"x": 972,
		"y": 615,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1054,
		"card": 34,
		"name": "BR XII Corps",
		"x": 87,
		"y": 744,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1055,
		"card": 34,
		"name": "BR XVI Corps",
		"x": 172,
		"y": 744,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1056,
		"card": 34,
		"name": "FR Army Orient 1",
		"x": 256,
		"y": 744,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1057,
		"card": 34,
		"name": "FR DIV #3 #4",
		"x": 332,
		"y": 735,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1058,
		"card": 34,
		"name": "Beachhead #6",
		"x": 409,
		"y": 744,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1059,
		"card": 35,
		"name": "BR Dunsterforce",
		"x": 521,
		"y": 735,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1060,
		"card": 35,
		"name": "BR/PE SPers Rifles",
		"x": 590,
		"y": 735,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1061,
		"card": 36,
		"name": "IN 17th DIV",
		"x": 693,
		"y": 735,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1062,
		"card": 36,
		"name": "IN 18th DIV",
		"x": 762,
		"y": 735,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1063,
		"card": 36,
		"name": "IN Cavalry #4 #5",
		"x": 830,
		"y": 735,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1064,
		"card": 37,
		"name": "RU DIV #15 #16 #17",
		"x": 935,
		"y": 735,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1065,
		"card": 40,
		"name": "W.W.Pt. token",
		"x": 89,
		"y": 865,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1066,
		"card": 42,
		"name": "J By C token",
		"x": 209,
		"y": 865,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1067,
		"card": 43,
		"name": "RU VII Caucasian",
		"x": 328,
		"y": 865,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1068,
		"card": 43,
		"name": "RU Caucasian Cav",
		"x": 412,
		"y": 865,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1069,
		"card": 43,
		"name": "RU Elite DIV #6 #7",
		"x": 488,
		"y": 855,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1070,
		"card": 47,
		"name": "IN 3rd Corps",
		"x": 600,
		"y": 865,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1071,
		"card": 47,
		"name": "IN Elite DIV #3",
		"x": 677,
		"y": 855,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1072,
		"card": 47,
		"name": "IN Cavalry #6",
		"x": 745,
		"y": 855,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1073,
		"card": 53,
		"name": "FR Army Orient 2",
		"x": 858,
		"y": 865,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1074,
		"card": 53,
		"name": "FR DIV #5 #6",
		"x": 933,
		"y": 855,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1075,
		"card": 53,
		"name": "FR D'Esperey HQ",
		"x": 1002,
		"y": 855,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1076,
		"card": 54,
		"name": "BR XX Corps",
		"x": 89,
		"y": 983,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1077,
		"card": 54,
		"name": "BR XXI Corps",
		"x": 172,
		"y": 983,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1078,
		"card": 54,
		"name": "BR DIV #5 #6",
		"x": 248,
		"y": 974,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1079,
		"card": 54,
		"name": "BR Cavalry #3",
		"x": 317,
		"y": 974,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1080,
		"card": 54,
		"name": "ANZ Cavalry #3",
		"x": 387,
		"y": 974,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1081,
		"card": 54,
		"name": "BR Allenby HQ",
		"x": 453,
		"y": 974,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1082,
		"card": 54,
		"name": "BR ANA Arab",
		"x": 522,
		"y": 974,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1083,
		"card": 55,
		"name": "ANZ Desert Corps",
		"x": 635,
		"y": 983,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1084,
		"card": 55,
		"name": "BR DIV #7",
		"x": 710,
		"y": 974,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1085,
		"card": 55,
		"name": "BR Cavalry #4",
		"x": 779,
		"y": 974,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1086,
		"card": 0,
		"name": "AP Removed Box",
		"x": 386,
		"y": 1106,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1087,
		"card": 0,
		"name": "AP Permanently Eliminated Box",
		"x": 686,
		"y": 1106,
		"side": "ap",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1088,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1089,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1090,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1091,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1092,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1093,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1094,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1095,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1096,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1097,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1098,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1099,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1100,
		"name": "Generated Gap",
		"type": "generated_gap",
		"generated": true,
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1101,
		"card": 8,
		"name": "Trench",
		"x": 90,
		"y": 145,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1102,
		"card": 10,
		"name": "TU-A DIV #10",
		"x": 233,
		"y": 137,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1103,
		"card": 13,
		"name": "TU Elite DIV #9 #10",
		"x": 394,
		"y": 137,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1104,
		"card": 13,
		"name": "TU Cavalry #5",
		"x": 462,
		"y": 137,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1105,
		"card": 18,
		"name": "TU-A DIV #11 #12 #13 #14",
		"x": 567,
		"y": 137,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1106,
		"card": 21,
		"name": "CP Air Superiority token",
		"x": 713,
		"y": 145,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1107,
		"card": 22,
		"name": "U_boats in the Med token",
		"x": 900,
		"y": 145,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1108,
		"card": 23,
		"name": "PE Uprising",
		"x": 81,
		"y": 257,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1109,
		"card": 23,
		"name": "Persian Uprising token",
		"x": 158,
		"y": 264,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1110,
		"card": 25,
		"name": "TU DIV #13 #14 #15 #16 #17",
		"x": 270,
		"y": 257,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1111,
		"card": 25,
		"name": "TU Cavalry #6",
		"x": 338,
		"y": 257,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1112,
		"card": 26,
		"name": "TU XIV Corps",
		"x": 450,
		"y": 265,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1113,
		"card": 26,
		"name": "TU XV Corps",
		"x": 534,
		"y": 265,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1114,
		"card": 26,
		"name": "TU XVI Corps",
		"x": 618,
		"y": 265,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1115,
		"card": 26,
		"name": "TU XVII Corps",
		"x": 702,
		"y": 265,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1116,
		"card": 26,
		"name": "TU-A XVIII Corps",
		"x": 786,
		"y": 264,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1117,
		"card": 26,
		"name": "TU DIV #18",
		"x": 863,
		"y": 257,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1118,
		"card": 26,
		"name": "TU-A DIV #15",
		"x": 930,
		"y": 257,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1119,
		"card": 29,
		"name": "BU 4 Army",
		"x": 89,
		"y": 383,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1120,
		"card": 34,
		"name": "Parvus to Berlin token",
		"x": 301,
		"y": 383,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1121,
		"card": 34,
		"name": "Revolution token",
		"x": 385,
		"y": 383,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1122,
		"card": 34,
		"name": "Long Live the Czar! token",
		"x": 470,
		"y": 383,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1123,
		"card": 37,
		"name": "TU-A DIV #16 #17 #18 #19",
		"x": 580,
		"y": 375,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1124,
		"card": 37,
		"name": "Trench",
		"x": 657,
		"y": 383,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1125,
		"card": 44,
		"name": "TU Army Islam HQ",
		"x": 769,
		"y": 375,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1126,
		"card": 45,
		"name": "GE Yildrim #1 #2 #3",
		"x": 918,
		"y": 375,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1127,
		"card": 49,
		"name": "BB.RR token",
		"x": 90,
		"y": 503,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1128,
		"card": 51,
		"name": "TU XX Corps",
		"x": 279,
		"y": 503,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1129,
		"card": 51,
		"name": "TU XXII Corps",
		"x": 363,
		"y": 503,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1130,
		"card": 51,
		"name": "TU-A Left Wing Gp",
		"x": 446,
		"y": 503,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1131,
		"card": 51,
		"name": "TU-A DIV #20",
		"x": 523,
		"y": 496,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1132,
		"card": 52,
		"name": "TU 1 Caucasian",
		"x": 635,
		"y": 503,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1133,
		"card": 52,
		"name": "TU 2 Caucasian",
		"x": 720,
		"y": 503,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1134,
		"card": 0,
		"name": "Afghan Uprising #1 #2 #3",
		"x": 81,
		"y": 711,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1135,
		"card": 0,
		"name": "CAsia Uprising",
		"x": 186,
		"y": 711,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1136,
		"card": 0,
		"name": "Egypt Rebel #1 #2 #3",
		"x": 290,
		"y": 711,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1137,
		"card": 0,
		"name": "Indian Mutiny #1 #2 #3",
		"x": 394,
		"y": 711,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1138,
		"card": 0,
		"name": "Arm Transcas #1 #2 #3",
		"x": 499,
		"y": 711,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1139,
		"card": 0,
		"name": "Geo Transcaucasian #1 #2",
		"x": 567,
		"y": 711,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1140,
		"card": 0,
		"name": "GE GeoProtect",
		"x": 636,
		"y": 711,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1141,
		"card": 0,
		"name": "Baku Uprising token",
		"x": 713,
		"y": 720,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1142,
		"card": 0,
		"name": "C.Asia Uprising token",
		"x": 797,
		"y": 720,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1143,
		"card": 0,
		"name": "Enzeli Uprising token",
		"x": 881,
		"y": 720,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1144,
		"card": 0,
		"name": "CP Removed Box",
		"x": 385,
		"y": 865,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1145,
		"card": 0,
		"name": "CP Permanently Eliminated Box",
		"x": 686,
		"y": 865,
		"side": "cp",
		"type": "reinforcement",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1146,
		"name": "AP MO RU",
		"x": 3165,
		"y": 2393,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1147,
		"name": "AP MO No Attack",
		"x": 3242,
		"y": 2392,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1148,
		"name": "AP MO BR/IN/ANZ",
		"x": 3318,
		"y": 2392,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1149,
		"name": "AP MO Meso/Persia",
		"x": 3395,
		"y": 2392,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1150,
		"name": "AP MO None",
		"x": 3473,
		"y": 2392,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1151,
		"name": "AP MO Balkans",
		"x": 3550,
		"y": 2393,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1152,
		"name": "AP MO Egypt",
		"x": 3626,
		"y": 2392,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1153,
		"name": "AP MO Made",
		"x": 3702,
		"y": 2392,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1154,
		"name": "APMO+0",
		"x": 3390,
		"y": 2267,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1155,
		"name": "APMO+1",
		"x": 3461,
		"y": 2267,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1156,
		"name": "APMO+2",
		"x": 3532,
		"y": 2267,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1157,
		"name": "APMO+3",
		"x": 3603,
		"y": 2267,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1158,
		"name": "APMO+4",
		"x": 3676,
		"y": 2267,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1159,
		"name": "CP MO RU",
		"x": 1391,
		"y": 147,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1160,
		"name": "CP MO BR/IN/ANZ",
		"x": 1464,
		"y": 147,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1161,
		"name": "CP MO TU",
		"x": 1537,
		"y": 147,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1162,
		"name": "CP MO Enver",
		"x": 1610,
		"y": 147,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1163,
		"name": "CP MO None",
		"x": 1681,
		"y": 147,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1164,
		"name": "GR 0",
		"x": 70,
		"y": 2405,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1165,
		"name": "GR 1",
		"x": 157,
		"y": 2405,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1166,
		"name": "GR 2",
		"x": 243,
		"y": 2405,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1167,
		"name": "GR 3",
		"x": 330,
		"y": 2405,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1168,
		"name": "GR 4",
		"x": 417,
		"y": 2405,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1169,
		"name": "GR 5",
		"x": 503,
		"y": 2405,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1170,
		"name": "GR 6",
		"x": 590,
		"y": 2405,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1171,
		"name": "GR 7",
		"x": 677,
		"y": 2405,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1172,
		"name": "GR 8",
		"x": 70,
		"y": 2505,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1173,
		"name": "GR 9",
		"x": 157,
		"y": 2505,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1174,
		"name": "GR 10",
		"x": 244,
		"y": 2505,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1175,
		"name": "GR 11",
		"x": 330,
		"y": 2505,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1176,
		"name": "GR 12",
		"x": 417,
		"y": 2505,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1177,
		"name": "GR 13",
		"x": 503,
		"y": 2505,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1178,
		"name": "GR 14",
		"x": 590,
		"y": 2505,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1179,
		"name": "GR 15",
		"x": 677,
		"y": 2505,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1180,
		"name": "GR 16",
		"x": 764,
		"y": 2505,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1181,
		"name": "GR 17",
		"x": 70,
		"y": 2603,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1182,
		"name": "GR 18",
		"x": 157,
		"y": 2603,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1183,
		"name": "GR 19",
		"x": 243,
		"y": 2603,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1184,
		"name": "GR 20",
		"x": 330,
		"y": 2603,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1185,
		"name": "GR 21",
		"x": 417,
		"y": 2603,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1186,
		"name": "GR 22",
		"x": 503,
		"y": 2603,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1187,
		"name": "GR 23",
		"x": 590,
		"y": 2603,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1188,
		"name": "GR 24",
		"x": 676,
		"y": 2603,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1189,
		"name": "GR 25",
		"x": 763,
		"y": 2603,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1190,
		"name": "GR 26",
		"x": 849,
		"y": 2603,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1191,
		"name": "GR 27",
		"x": 70,
		"y": 2706,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1192,
		"name": "GR 28",
		"x": 157,
		"y": 2705,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1193,
		"name": "GR 29",
		"x": 243,
		"y": 2705,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1194,
		"name": "GR 30",
		"x": 330,
		"y": 2705,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1195,
		"name": "GR 31",
		"x": 417,
		"y": 2705,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1196,
		"name": "GR 32",
		"x": 503,
		"y": 2705,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1197,
		"name": "GR 33",
		"x": 590,
		"y": 2705,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1198,
		"name": "GR 34",
		"x": 677,
		"y": 2705,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1199,
		"name": "GR 35",
		"x": 764,
		"y": 2705,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1200,
		"name": "GR 36",
		"x": 850,
		"y": 2705,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1201,
		"name": "GR 37",
		"x": 937,
		"y": 2705,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1202,
		"name": "GR 38",
		"x": 1023,
		"y": 2705,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1203,
		"name": "GR 39",
		"x": 1110,
		"y": 2705,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1204,
		"name": "GR 40",
		"x": 1197,
		"y": 2705,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1205,
		"name": "RU Rev",
		"x": 2800,
		"y": 73,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1206,
		"name": "RU Rev1",
		"x": 2871,
		"y": 73,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1207,
		"name": "RU Rev2",
		"x": 2942,
		"y": 73,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1208,
		"name": "RU Rev3",
		"x": 3014,
		"y": 73,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1209,
		"name": "RU Rev4",
		"x": 3085,
		"y": 73,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1210,
		"name": "Turn 1",
		"x": 3837,
		"y": 2345,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1211,
		"name": "Turn 2",
		"x": 3837,
		"y": 2435,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1212,
		"name": "Turn 3",
		"x": 3973,
		"y": 2435,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1213,
		"name": "Turn 4",
		"x": 4111,
		"y": 2435,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1214,
		"name": "Turn 5",
		"x": 4248,
		"y": 2435,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1215,
		"name": "Turn 6",
		"x": 3837,
		"y": 2527,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1216,
		"name": "Turn 7",
		"x": 3973,
		"y": 2527,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1217,
		"name": "Turn 8",
		"x": 4111,
		"y": 2527,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1218,
		"name": "Turn 9",
		"x": 4248,
		"y": 2527,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1219,
		"name": "Turn 10",
		"x": 3837,
		"y": 2619,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1220,
		"name": "Turn 11",
		"x": 3973,
		"y": 2619,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1221,
		"name": "Turn 12",
		"x": 4111,
		"y": 2619,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1222,
		"name": "Turn 13",
		"x": 4248,
		"y": 2619,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1223,
		"name": "Turn 14",
		"x": 3837,
		"y": 2710,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1224,
		"name": "Turn 15",
		"x": 3973,
		"y": 2710,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1225,
		"name": "Turn 16",
		"x": 4111,
		"y": 2710,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1226,
		"name": "Turn 17",
		"x": 4248,
		"y": 2710,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1227,
		"name": "neutral_gr_UI",
		"x": 150,
		"y": 958,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1228,
		"name": "neutral_bu_UI",
		"x": 530,
		"y": 414,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1229,
		"name": "neutral_ro_UI",
		"x": 694,
		"y": 127,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1230,
		"name": "LCU_limit_AP1",
		"x": 2681,
		"y": 1916,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1231,
		"name": "LCU_limit_AP2",
		"x": 2753,
		"y": 1916,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1232,
		"name": "LCU_limit_AP3",
		"x": 2824,
		"y": 1916,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1233,
		"name": "LCU_limit_CP1",
		"x": 2681,
		"y": 2024,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1234,
		"name": "LCU_limit_CP2",
		"x": 2752,
		"y": 2024,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1235,
		"name": "LCU_limit_CP3",
		"x": 2826,
		"y": 2024,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1236,
		"name": "C.Asia_Revolt",
		"x": 4103,
		"y": 296,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1237,
		"name": "Afghan_Alliance",
		"x": 4093,
		"y": 689,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1238,
		"name": "Indian_Mutiny",
		"x": 4245,
		"y": 983,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1239,
		"name": "Persian_Neutrality",
		"x": 3876,
		"y": 762,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1240,
		"name": "CP Air Superiority",
		"x": 1219,
		"y": 1654,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1241,
		"name": "GE RPs TO TU",
		"x": 1328,
		"y": 1654,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1242,
		"name": "BR RPs TO RU",
		"x": 799,
		"y": 2139,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1243,
		"name": "AP Air Superiority",
		"x": 910,
		"y": 2139,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1244,
		"name": "RU Amphib Assault Allowed",
		"x": 1019,
		"y": 2139,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1245,
		"name": "Cyprus Allowed",
		"x": 1570,
		"y": 1566,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1246,
		"name": "Egypt Uprising",
		"x": 1497,
		"y": 2128,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1247,
		"name": "Sinai Railroad",
		"x": 1792,
		"y": 2131,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1248,
		"name": "neutral_SB_UI",
		"x": 80,
		"y": 325,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1249,
		"name": "SUB IN THE MED",
		"x": 700,
		"y": 1256,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1250,
		"name": "BB.RR",
		"x": 1958,
		"y": 1083,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1251,
		"name": "box_cp_corps_assets_tu_lcu",
		"x": 808,
		"y": 1760,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1252,
		"name": "box_cp_corps_assets_tua_lcu",
		"x": 927,
		"y": 1760,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1253,
		"name": "box_cp_reserve_tu_scu",
		"x": 1055,
		"y": 1680,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1254,
		"name": "box_cp_reserve_tua_scu",
		"x": 1145,
		"y": 1680,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1255,
		"name": "box_cp_reserve_bu_scu",
		"x": 1055,
		"y": 1800,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1256,
		"name": "box_cp_reserve_ge_scu",
		"x": 1145,
		"y": 1800,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1257,
		"name": "box_cp_reserve_ah_scu",
		"x": 1240,
		"y": 1800,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1258,
		"name": "box_cp_reserve_minor_scu",
		"x": 1340,
		"y": 1800,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1259,
		"name": "box_cp_eliminated_tu_lcu",
		"x": 2155,
		"y": 85,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1260,
		"name": "box_cp_eliminated_tu_scu",
		"x": 2155,
		"y": 170,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1261,
		"name": "box_cp_eliminated_tua_lcu",
		"x": 2238,
		"y": 85,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1262,
		"name": "box_cp_eliminated_tua_scu",
		"x": 2238,
		"y": 170,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1263,
		"name": "box_cp_eliminated_bu_lcu",
		"x": 2320,
		"y": 85,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1264,
		"name": "box_cp_eliminated_bu_scu",
		"x": 2320,
		"y": 170,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1265,
		"name": "box_cp_eliminated_ge_lcu",
		"x": 2155,
		"y": 260,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1266,
		"name": "box_cp_eliminated_ge_scu",
		"x": 2155,
		"y": 340,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1267,
		"name": "box_cp_eliminated_ah_lcu",
		"x": 2240,
		"y": 260,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1268,
		"name": "box_cp_eliminated_ah_scu",
		"x": 2238,
		"y": 340,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1269,
		"name": "box_cp_eliminated_minor",
		"x": 2320,
		"y": 340,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1270,
		"name": "box_cp_eliminated_tr",
		"x": 2320,
		"y": 260,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1271,
		"name": "box_ap_corps_assets_ru_lcu",
		"x": 1230,
		"y": 1995,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1272,
		"name": "box_ap_corps_assets_br_lcu",
		"x": 1230,
		"y": 2080,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1273,
		"name": "box_ap_corps_assets_in_lcu",
		"x": 1340,
		"y": 1995,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1274,
		"name": "box_ap_corps_assets_fr_lcu",
		"x": 1340,
		"y": 2080,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1275,
		"name": "box_ap_corps_assets_anz_lcu",
		"x": 1230,
		"y": 2160,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1276,
		"name": "box_ap_reserve_ru_scu",
		"x": 815,
		"y": 1995,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1277,
		"name": "box_ap_reserve_br_scu",
		"x": 815,
		"y": 2065,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1278,
		"name": "box_ap_reserve_in_scu",
		"x": 910,
		"y": 1995,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1279,
		"name": "box_ap_reserve_anz_scu",
		"x": 910,
		"y": 2065,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1280,
		"name": "box_ap_reserve_sb_scu",
		"x": 1005,
		"y": 1995,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1281,
		"name": "box_ap_reserve_ro_scu",
		"x": 1005,
		"y": 2065,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1282,
		"name": "box_ap_reserve_fr_scu",
		"x": 1095,
		"y": 1995,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1283,
		"name": "box_ap_reserve_other_scu",
		"x": 1095,
		"y": 2065,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1284,
		"name": "box_ap_reserve_beachhead",
		"x": 1115,
		"y": 2160,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1285,
		"name": "box_ap_eliminated_ru_lcu",
		"x": 1548,
		"y": 2615,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1286,
		"name": "box_ap_eliminated_ru_scu",
		"x": 1548,
		"y": 2678,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1287,
		"name": "box_ap_eliminated_br_lcu",
		"x": 1624,
		"y": 2615,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1288,
		"name": "box_ap_eliminated_br_scu",
		"x": 1624,
		"y": 2678,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1289,
		"name": "box_ap_eliminated_anz_lcu",
		"x": 1699,
		"y": 2615,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1290,
		"name": "box_ap_eliminated_anz_scu",
		"x": 1699,
		"y": 2678,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1291,
		"name": "box_ap_eliminated_in_lcu",
		"x": 1780,
		"y": 2615,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1292,
		"name": "box_ap_eliminated_in_scu",
		"x": 1780,
		"y": 2678,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1293,
		"name": "box_ap_eliminated_sb_lcu",
		"x": 1855,
		"y": 2615,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1294,
		"name": "box_ap_eliminated_sb_scu",
		"x": 1855,
		"y": 2678,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1295,
		"name": "box_ap_eliminated_fr_lcu",
		"x": 1548,
		"y": 2740,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1296,
		"name": "box_ap_eliminated_fr_scu",
		"x": 1624,
		"y": 2740,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1297,
		"name": "box_ap_eliminated_ro_lcu",
		"x": 1699,
		"y": 2740,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1298,
		"name": "box_ap_eliminated_ro_scu",
		"x": 1780,
		"y": 2740,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1299,
		"name": "box_ap_eliminated_other",
		"x": 1855,
		"y": 2740,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1300,
		"name": "INDIA_control",
		"x": 4250,
		"y": 1170,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	},
	{
		"id": 1301,
		"name": "CENTRAL_ASIA_control",
		"x": 4248,
		"y": 432,
		"type": "ui",
		"connections": [],
		"rail_connections": [],
		"connection_types": {}
	}
],
	edges: [
	{
		"a": 6,
		"b": 14,
		"type": "rail"
	},
	{
		"a": 4,
		"b": 18,
		"type": "rail"
	},
	{
		"a": 5,
		"b": 13,
		"type": "rail"
	},
	{
		"a": 8,
		"b": 13,
		"type": "rail"
	},
	{
		"a": 13,
		"b": 18,
		"type": "rail"
	},
	{
		"a": 7,
		"b": 13,
		"type": "rail"
	},
	{
		"a": 1,
		"b": 4
	},
	{
		"a": 1,
		"b": 8
	},
	{
		"a": 1,
		"b": 5,
		"type": "rail"
	},
	{
		"a": 2,
		"b": 5,
		"type": "rail"
	},
	{
		"a": 2,
		"b": 3,
		"type": "rail"
	},
	{
		"a": 3,
		"b": 295,
		"nations": "ru",
		"type": "rail"
	},
	{
		"a": 2,
		"b": 7
	},
	{
		"a": 7,
		"b": 16,
		"type": "rail",
		"crossing": 1
	},
	{
		"a": 7,
		"b": 15,
		"crossing": 1
	},
	{
		"a": 16,
		"b": 15
	},
	{
		"a": 15,
		"b": 27
	},
	{
		"a": 15,
		"b": 24
	},
	{
		"a": 16,
		"b": 27
	},
	{
		"a": 24,
		"b": 27,
		"type": "rail"
	},
	{
		"a": 27,
		"b": 42
	},
	{
		"a": 39,
		"b": 56
	},
	{
		"a": 42,
		"b": 56
	},
	{
		"a": 56,
		"b": 63,
		"type": "rail"
	},
	{
		"a": 56,
		"b": 75,
		"type": "rail"
	},
	{
		"a": 49,
		"b": 56,
		"type": "rail"
	},
	{
		"a": 34,
		"b": 39
	},
	{
		"a": 39,
		"b": 42,
		"type": "rail"
	},
	{
		"a": 24,
		"b": 31,
		"type": "rail",
		"crossing": 3
	},
	{
		"a": 31,
		"b": 36,
		"type": "rail"
	},
	{
		"a": 18,
		"b": 31,
		"crossing": 1
	},
	{
		"a": 25,
		"b": 31
	},
	{
		"a": 31,
		"b": 34
	},
	{
		"a": 18,
		"b": 24,
		"crossing": 1
	},
	{
		"a": 18,
		"b": 25,
		"crossing": 1
	},
	{
		"a": 6,
		"b": 296,
		"nations": "CP",
		"type": "rail"
	},
	{
		"a": 17,
		"b": 296,
		"nations": "CP",
		"type": "rail",
		"crossing": 3
	},
	{
		"a": 4,
		"b": 296,
		"nations": "CP",
		"type": "rail"
	},
	{
		"a": 17,
		"b": 29,
		"type": "rail"
	},
	{
		"a": 29,
		"b": 41,
		"type": "rail"
	},
	{
		"a": 25,
		"b": 29
	},
	{
		"a": 17,
		"b": 41
	},
	{
		"a": 36,
		"b": 49,
		"type": "rail"
	},
	{
		"a": 29,
		"b": 36,
		"type": "rail"
	},
	{
		"a": 36,
		"b": 54
	},
	{
		"a": 36,
		"b": 50
	},
	{
		"a": 41,
		"b": 50,
		"type": "rail"
	},
	{
		"a": 50,
		"b": 73,
		"type": "rail"
	},
	{
		"a": 50,
		"b": 70
	},
	{
		"a": 54,
		"b": 73
	},
	{
		"a": 73,
		"b": 88
	},
	{
		"a": 69,
		"b": 73,
		"type": "rail"
	},
	{
		"a": 73,
		"b": 95,
		"type": "rail"
	},
	{
		"a": 54,
		"b": 69
	},
	{
		"a": 69,
		"b": 88
	},
	{
		"a": 69,
		"b": 75,
		"type": "rail"
	},
	{
		"a": 39,
		"b": 49,
		"type": "rail"
	},
	{
		"a": 49,
		"b": 75
	},
	{
		"a": 63,
		"b": 65,
		"type": "rail"
	},
	{
		"a": 65,
		"b": 287,
		"type": "rail"
	},
	{
		"a": 65,
		"b": 89,
		"type": "strait",
		"crossing": 1,
		"flags": 5
	},
	{
		"a": 79,
		"b": 89,
		"type": "strait",
		"crossing": 1,
		"flags": 4
	},
	{
		"a": 63,
		"b": 79
	},
	{
		"a": 92,
		"b": 95
	},
	{
		"a": 92,
		"b": 117
	},
	{
		"a": 70,
		"b": 92
	},
	{
		"a": 92,
		"b": 93
	},
	{
		"a": 70,
		"b": 93
	},
	{
		"a": 93,
		"b": 114
	},
	{
		"a": 117,
		"b": 131
	},
	{
		"a": 114,
		"b": 131
	},
	{
		"a": 131,
		"b": 149
	},
	{
		"a": 114,
		"b": 117
	},
	{
		"a": 95,
		"b": 117
	},
	{
		"a": 82,
		"b": 94
	},
	{
		"a": 94,
		"b": 105
	},
	{
		"a": 89,
		"b": 94
	},
	{
		"a": 82,
		"b": 287,
		"type": "rail"
	},
	{
		"a": 82,
		"b": 105,
		"type": "rail"
	},
	{
		"a": 76,
		"b": 82
	},
	{
		"a": 103,
		"b": 104,
		"type": "rail"
	},
	{
		"a": 97,
		"b": 103
	},
	{
		"a": 103,
		"b": 121
	},
	{
		"a": 81,
		"b": 103
	},
	{
		"a": 76,
		"b": 81
	},
	{
		"a": 35,
		"b": 60
	},
	{
		"a": 60,
		"b": 53
	},
	{
		"a": 60,
		"b": 76
	},
	{
		"a": 57,
		"b": 76
	},
	{
		"a": 241,
		"b": 249,
		"type": "rail"
	},
	{
		"a": 228,
		"b": 241,
		"type": "rail"
	},
	{
		"a": 249,
		"b": 237
	},
	{
		"a": 228,
		"b": 237,
		"type": "rail"
	},
	{
		"a": 239,
		"b": 227
	},
	{
		"a": 209,
		"b": 213,
		"type": "strait",
		"crossing": 2
	},
	{
		"a": 223,
		"b": 228,
		"type": "strait",
		"crossing": 2
	},
	{
		"a": 238,
		"b": 225,
		"type": "strait",
		"crossing": 2
	},
	{
		"a": 252,
		"b": 246,
		"type": "strait",
		"crossing": 2
	},
	{
		"a": 290,
		"b": 234,
		"type": "strait",
		"crossing": 2
	},
	{
		"a": 126,
		"b": 135,
		"type": "strait",
		"crossing": 2
	},
	{
		"a": 136,
		"b": 149,
		"type": "strait",
		"crossing": 2
	},
	{
		"a": 166,
		"b": 150,
		"type": "strait",
		"crossing": 2
	},
	{
		"a": 3,
		"b": 16,
		"crossing": 1
	},
	{
		"a": 288,
		"b": 126,
		"type": "strait"
	},
	{
		"a": 288,
		"b": 136,
		"type": "strait"
	},
	{
		"a": 113,
		"b": 95,
		"type": "strait",
		"crossing": 2
	},
	{
		"a": 288,
		"b": 247,
		"type": "strait"
	},
	{
		"a": 288,
		"b": 221,
		"type": "strait"
	},
	{
		"a": 288,
		"b": 210,
		"type": "strait"
	},
	{
		"a": 288,
		"b": 197,
		"type": "strait"
	},
	{
		"a": 239,
		"b": 248,
		"type": "strait",
		"crossing": 1,
		"flags": 1
	},
	{
		"a": 227,
		"b": 218
	},
	{
		"a": 218,
		"b": 204
	},
	{
		"a": 218,
		"b": 199
	},
	{
		"a": 218,
		"b": 220,
		"type": "strait",
		"crossing": 1,
		"flags": 2
	},
	{
		"a": 188,
		"b": 199
	},
	{
		"a": 188,
		"b": 204
	},
	{
		"a": 180,
		"b": 188
	},
	{
		"a": 188,
		"b": 197,
		"type": "strait",
		"crossing": 3
	},
	{
		"a": 221,
		"b": 239,
		"type": "strait",
		"crossing": 2
	},
	{
		"a": 248,
		"b": 247,
		"type": "strait",
		"crossing": 3
	},
	{
		"a": 191,
		"b": 178,
		"type": "strait",
		"crossing": 1,
		"flags": 3
	},
	{
		"a": 191,
		"b": 211
	},
	{
		"a": 180,
		"b": 177
	},
	{
		"a": 180,
		"b": 199
	},
	{
		"a": 187,
		"b": 177
	},
	{
		"a": 187,
		"b": 178
	},
	{
		"a": 187,
		"b": 199
	},
	{
		"a": 211,
		"b": 220
	},
	{
		"a": 204,
		"b": 210,
		"type": "strait",
		"crossing": 3
	},
	{
		"a": 233,
		"b": 220
	},
	{
		"a": 233,
		"b": 243
	},
	{
		"a": 243,
		"b": 248
	},
	{
		"a": 243,
		"b": 250
	},
	{
		"a": 242,
		"b": 232
	},
	{
		"a": 242,
		"b": 250
	},
	{
		"a": 232,
		"b": 220
	},
	{
		"a": 111,
		"b": 105
	},
	{
		"a": 111,
		"b": 112
	},
	{
		"a": 111,
		"b": 89,
		"type": "rail"
	},
	{
		"a": 111,
		"b": 128,
		"type": "rail"
	},
	{
		"a": 191,
		"b": 89
	},
	{
		"a": 169,
		"b": 79
	},
	{
		"a": 127,
		"b": 124,
		"type": "rail"
	},
	{
		"a": 127,
		"b": 128,
		"type": "rail"
	},
	{
		"a": 143,
		"b": 135,
		"type": "rail"
	},
	{
		"a": 143,
		"b": 164
	},
	{
		"a": 128,
		"b": 112
	},
	{
		"a": 128,
		"b": 135,
		"type": "rail"
	},
	{
		"a": 143,
		"b": 145,
		"type": "rail"
	},
	{
		"a": 68,
		"b": 289
	},
	{
		"a": 68,
		"b": 74
	},
	{
		"a": 68,
		"b": 86
	},
	{
		"a": 68,
		"b": 85
	},
	{
		"a": 68,
		"b": 53
	},
	{
		"a": 74,
		"b": 71
	},
	{
		"a": 74,
		"b": 86
	},
	{
		"a": 61,
		"b": 52
	},
	{
		"a": 61,
		"b": 71
	},
	{
		"a": 61,
		"b": 44
	},
	{
		"a": 61,
		"b": 48
	},
	{
		"a": 48,
		"b": 44
	},
	{
		"a": 38,
		"b": 30
	},
	{
		"a": 38,
		"b": 44
	},
	{
		"a": 46,
		"b": 52
	},
	{
		"a": 46,
		"b": 67
	},
	{
		"a": 46,
		"b": 58
	},
	{
		"a": 46,
		"b": 47
	},
	{
		"a": 46,
		"b": 30
	},
	{
		"a": 43,
		"b": 32
	},
	{
		"a": 43,
		"b": 51
	},
	{
		"a": 43,
		"b": 62
	},
	{
		"a": 43,
		"b": 47
	},
	{
		"a": 33,
		"b": 30
	},
	{
		"a": 33,
		"b": 43
	},
	{
		"a": 33,
		"b": 22,
		"type": "rail"
	},
	{
		"a": 20,
		"b": 26,
		"type": "rail"
	},
	{
		"a": 20,
		"b": 12,
		"type": "rail"
	},
	{
		"a": 10,
		"b": 12,
		"type": "rail"
	},
	{
		"a": 10,
		"b": 19,
		"type": "rail"
	},
	{
		"a": 10,
		"b": 11
	},
	{
		"a": 21,
		"b": 10
	},
	{
		"a": 21,
		"b": 22
	},
	{
		"a": 21,
		"b": 30
	},
	{
		"a": 37,
		"b": 55,
		"type": "rail"
	},
	{
		"a": 37,
		"b": 32,
		"type": "rail"
	},
	{
		"a": 28,
		"b": 23,
		"type": "rail"
	},
	{
		"a": 28,
		"b": 26,
		"type": "rail"
	},
	{
		"a": 28,
		"b": 40
	},
	{
		"a": 28,
		"b": 45
	},
	{
		"a": 9,
		"b": 23,
		"type": "rail"
	},
	{
		"a": 9,
		"b": 297,
		"nations": "ru",
		"type": "rail"
	},
	{
		"a": 283,
		"b": 78,
		"nations": "no_tribe",
		"type": "green",
		"crossing": 1
	},
	{
		"a": 298,
		"b": 283,
		"type": "green"
	},
	{
		"a": 299,
		"b": 298,
		"type": "green"
	},
	{
		"a": 299,
		"b": 201,
		"type": "green"
	},
	{
		"a": 201,
		"b": 172,
		"type": "green"
	},
	{
		"a": 201,
		"b": 174,
		"type": "green"
	},
	{
		"a": 201,
		"b": 225,
		"type": "green"
	},
	{
		"a": 225,
		"b": 226
	},
	{
		"a": 207,
		"b": 225
	},
	{
		"a": 225,
		"b": 234
	},
	{
		"a": 240,
		"b": 226
	},
	{
		"a": 240,
		"b": 229
	},
	{
		"a": 240,
		"b": 246
	},
	{
		"a": 291,
		"b": 252,
		"type": "strait"
	},
	{
		"a": 291,
		"b": 290,
		"type": "strait"
	},
	{
		"a": 291,
		"b": 238,
		"type": "strait"
	},
	{
		"a": 174,
		"b": 292,
		"type": "green"
	},
	{
		"a": 174,
		"b": 172,
		"type": "green"
	},
	{
		"a": 174,
		"b": 151,
		"type": "green"
	},
	{
		"a": 207,
		"b": 186
	},
	{
		"a": 207,
		"b": 203
	},
	{
		"a": 173,
		"b": 153
	},
	{
		"a": 173,
		"b": 186
	},
	{
		"a": 138,
		"b": 153
	},
	{
		"a": 138,
		"b": 152
	},
	{
		"a": 138,
		"b": 130
	},
	{
		"a": 147,
		"b": 153
	},
	{
		"a": 147,
		"b": 133
	},
	{
		"a": 133,
		"b": 151
	},
	{
		"a": 133,
		"b": 122
	},
	{
		"a": 292,
		"b": 122,
		"type": "green"
	},
	{
		"a": 115,
		"b": 122
	},
	{
		"a": 115,
		"b": 130
	},
	{
		"a": 115,
		"b": 110
	},
	{
		"a": 115,
		"b": 101
	},
	{
		"a": 101,
		"b": 78
	},
	{
		"a": 78,
		"b": 23,
		"nations": "no_tribe",
		"type": "green"
	},
	{
		"a": 59,
		"b": 40
	},
	{
		"a": 59,
		"b": 64
	},
	{
		"a": 59,
		"b": 78
	},
	{
		"a": 55,
		"b": 45
	},
	{
		"a": 55,
		"b": 51
	},
	{
		"a": 55,
		"b": 80,
		"type": "rail"
	},
	{
		"a": 64,
		"b": 80
	},
	{
		"a": 64,
		"b": 83
	},
	{
		"a": 83,
		"b": 80
	},
	{
		"a": 83,
		"b": 99
	},
	{
		"a": 83,
		"b": 119
	},
	{
		"a": 83,
		"b": 110
	},
	{
		"a": 99,
		"b": 80
	},
	{
		"a": 99,
		"b": 119
	},
	{
		"a": 99,
		"b": 118
	},
	{
		"a": 132,
		"b": 119
	},
	{
		"a": 132,
		"b": 152
	},
	{
		"a": 132,
		"b": 148
	},
	{
		"a": 148,
		"b": 146
	},
	{
		"a": 148,
		"b": 168
	},
	{
		"a": 163,
		"b": 152
	},
	{
		"a": 163,
		"b": 168
	},
	{
		"a": 154,
		"b": 146
	},
	{
		"a": 154,
		"b": 167
	},
	{
		"a": 154,
		"b": 134
	},
	{
		"a": 146,
		"b": 134
	},
	{
		"a": 229,
		"b": 216
	},
	{
		"a": 229,
		"b": 214
	},
	{
		"a": 229,
		"b": 230
	},
	{
		"a": 198,
		"b": 190,
		"crossing": 1
	},
	{
		"a": 198,
		"b": 214,
		"crossing": 3
	},
	{
		"a": 198,
		"b": 194,
		"crossing": 3
	},
	{
		"a": 203,
		"b": 190
	},
	{
		"a": 203,
		"b": 216
	},
	{
		"a": 222,
		"b": 230
	},
	{
		"a": 222,
		"b": 206,
		"crossing": 2
	},
	{
		"a": 215,
		"b": 222
	},
	{
		"a": 215,
		"b": 205
	},
	{
		"a": 195,
		"b": 184
	},
	{
		"a": 195,
		"b": 206,
		"crossing": 3
	},
	{
		"a": 195,
		"b": 189
	},
	{
		"a": 195,
		"b": 205
	},
	{
		"a": 189,
		"b": 184
	},
	{
		"a": 189,
		"b": 205
	},
	{
		"a": 189,
		"b": 179
	},
	{
		"a": 185,
		"b": 184
	},
	{
		"a": 185,
		"b": 194
	},
	{
		"a": 194,
		"b": 206
	},
	{
		"a": 216,
		"b": 226
	},
	{
		"a": 91,
		"b": 86
	},
	{
		"a": 91,
		"b": 109
	},
	{
		"a": 91,
		"b": 71
	},
	{
		"a": 100,
		"b": 109
	},
	{
		"a": 100,
		"b": 71
	},
	{
		"a": 100,
		"b": 84
	},
	{
		"a": 84,
		"b": 77
	},
	{
		"a": 84,
		"b": 98
	},
	{
		"a": 84,
		"b": 67
	},
	{
		"a": 67,
		"b": 52
	},
	{
		"a": 67,
		"b": 71
	},
	{
		"a": 67,
		"b": 58
	},
	{
		"a": 77,
		"b": 62
	},
	{
		"a": 77,
		"b": 66
	},
	{
		"a": 62,
		"b": 58
	},
	{
		"a": 62,
		"b": 47
	},
	{
		"a": 47,
		"b": 58
	},
	{
		"a": 47,
		"b": 33,
		"type": "rail"
	},
	{
		"a": 105,
		"b": 104,
		"type": "rail"
	},
	{
		"a": 105,
		"b": 124,
		"type": "rail"
	},
	{
		"a": 124,
		"b": 144
	},
	{
		"a": 124,
		"b": 142,
		"type": "rail"
	},
	{
		"a": 144,
		"b": 145,
		"type": "rail"
	},
	{
		"a": 144,
		"b": 162
	},
	{
		"a": 162,
		"b": 158
	},
	{
		"a": 157,
		"b": 158
	},
	{
		"a": 157,
		"b": 150,
		"type": "rail"
	},
	{
		"a": 150,
		"b": 140,
		"type": "rail"
	},
	{
		"a": 150,
		"b": 139,
		"type": "rail",
		"flags": "event_berlin_baghdad;virtual"
	},
	{
		"a": 140,
		"b": 155,
		"type": "rail",
		"flags": "event_berlin_baghdad;virtual"
	},
	{
		"a": 140,
		"b": 159,
		"type": "rail"
	},
	{
		"a": 170,
		"b": 171
	},
	{
		"a": 170,
		"b": 159
	},
	{
		"a": 171,
		"b": 155,
		"type": "rail"
	},
	{
		"a": 171,
		"b": 182,
		"type": "rail"
	},
	{
		"a": 159,
		"b": 155
	},
	{
		"a": 160,
		"b": 161
	},
	{
		"a": 160,
		"b": 155
	},
	{
		"a": 97,
		"b": 85
	},
	{
		"a": 85,
		"b": 86
	},
	{
		"a": 48,
		"b": 289
	},
	{
		"a": 106,
		"b": 86
	},
	{
		"a": 106,
		"b": 107
	},
	{
		"a": 106,
		"b": 123
	},
	{
		"a": 107,
		"b": 121
	},
	{
		"a": 108,
		"b": 86
	},
	{
		"a": 108,
		"b": 109
	},
	{
		"a": 139,
		"b": 123
	},
	{
		"a": 139,
		"b": 142,
		"type": "rail"
	},
	{
		"a": 87,
		"b": 66
	},
	{
		"a": 87,
		"b": 72
	},
	{
		"a": 98,
		"b": 87
	},
	{
		"a": 116,
		"b": 98
	},
	{
		"a": 116,
		"b": 120
	},
	{
		"a": 116,
		"b": 134
	},
	{
		"a": 120,
		"b": 100
	},
	{
		"a": 120,
		"b": 98
	},
	{
		"a": 120,
		"b": 137
	},
	{
		"a": 129,
		"b": 120
	},
	{
		"a": 129,
		"b": 141
	},
	{
		"a": 141,
		"b": 134
	},
	{
		"a": 141,
		"b": 137
	},
	{
		"a": 141,
		"b": 156
	},
	{
		"a": 137,
		"b": 155,
		"type": "rail"
	},
	{
		"a": 156,
		"b": 161
	},
	{
		"a": 175,
		"b": 161
	},
	{
		"a": 175,
		"b": 181
	},
	{
		"a": 179,
		"b": 181
	},
	{
		"a": 125,
		"b": 118
	},
	{
		"a": 125,
		"b": 134
	},
	{
		"a": 96,
		"b": 102
	},
	{
		"a": 96,
		"b": 72
	},
	{
		"a": 96,
		"b": 118
	},
	{
		"a": 87,
		"b": 102
	},
	{
		"a": 51,
		"b": 72
	},
	{
		"a": 51,
		"b": 66
	},
	{
		"a": 80,
		"b": 72
	},
	{
		"a": 183,
		"b": 166,
		"type": "strait"
	},
	{
		"a": 183,
		"b": 192,
		"type": "strait"
	},
	{
		"a": 183,
		"b": 209,
		"type": "strait"
	},
	{
		"a": 183,
		"b": 223,
		"type": "strait"
	},
	{
		"a": 192,
		"b": 196,
		"type": "strait",
		"crossing": 2
	},
	{
		"a": 40,
		"b": 23
	},
	{
		"a": 193,
		"b": 182,
		"type": "rail"
	},
	{
		"a": 193,
		"b": 202,
		"type": "rail"
	},
	{
		"a": 193,
		"b": 196,
		"type": "rail"
	},
	{
		"a": 208,
		"b": 213,
		"type": "rail"
	},
	{
		"a": 208,
		"b": 217,
		"type": "rail"
	},
	{
		"a": 208,
		"b": 202
	},
	{
		"a": 224,
		"b": 208,
		"type": "rail"
	},
	{
		"a": 224,
		"b": 228,
		"type": "rail"
	},
	{
		"a": 224,
		"b": 237
	},
	{
		"a": 213,
		"b": 196
	},
	{
		"a": 213,
		"b": 228
	},
	{
		"a": 217,
		"b": 202,
		"type": "rail"
	},
	{
		"a": 217,
		"b": 236,
		"type": "rail"
	},
	{
		"a": 244,
		"b": 249
	},
	{
		"a": 244,
		"b": 236,
		"type": "rail"
	},
	{
		"a": 236,
		"b": 237
	},
	{
		"a": 263,
		"b": 244,
		"type": "rail"
	},
	{
		"a": 263,
		"b": 272,
		"nations": "arab_and_tu",
		"type": "rail"
	},
	{
		"a": 263,
		"b": 271
	},
	{
		"a": 277,
		"b": 278,
		"nations": "arab_and_tu"
	},
	{
		"a": 277,
		"b": 280,
		"nations": "arab_and_tu"
	},
	{
		"a": 280,
		"b": 278,
		"nations": "arab_and_tu"
	},
	{
		"a": 280,
		"b": 276,
		"nations": "arab_and_tu"
	},
	{
		"a": 276,
		"b": 271,
		"nations": "arab_and_tu"
	},
	{
		"a": 277,
		"b": 272,
		"nations": "arab_and_tu",
		"type": "rail"
	},
	{
		"a": 278,
		"b": 245,
		"nations": "arab",
		"type": "green"
	},
	{
		"a": 235,
		"b": 236,
		"nations": "arab",
		"type": "green"
	},
	{
		"a": 235,
		"b": 245,
		"nations": "arab",
		"type": "green"
	},
	{
		"a": 235,
		"b": 219,
		"nations": "arab",
		"type": "green"
	},
	{
		"a": 219,
		"b": 217,
		"nations": "arab",
		"type": "green"
	},
	{
		"a": 219,
		"b": 202,
		"nations": "arab",
		"type": "green"
	},
	{
		"a": 261,
		"b": 249
	},
	{
		"a": 261,
		"b": 251
	},
	{
		"a": 261,
		"b": 265
	},
	{
		"a": 261,
		"b": 270
	},
	{
		"a": 251,
		"b": 241,
		"type": "rail",
		"flags": "event_xinai"
	},
	{
		"a": 251,
		"b": 254,
		"type": "rail",
		"flags": "event_xinai"
	},
	{
		"a": 251,
		"b": 265
	},
	{
		"a": 265,
		"b": 270
	},
	{
		"a": 265,
		"b": 262,
		"crossing": 1
	},
	{
		"a": 265,
		"b": 254
	},
	{
		"a": 269,
		"b": 270,
		"crossing": 1
	},
	{
		"a": 269,
		"b": 262,
		"type": "rail"
	},
	{
		"a": 269,
		"b": 268,
		"type": "rail"
	},
	{
		"a": 262,
		"b": 255,
		"type": "rail"
	},
	{
		"a": 262,
		"b": 257,
		"type": "rail"
	},
	{
		"a": 255,
		"b": 254,
		"crossing": 1
	},
	{
		"a": 254,
		"b": 262,
		"type": "rail",
		"crossing": 1,
		"flags": "event_xinai"
	},
	{
		"a": 268,
		"b": 257,
		"type": "rail"
	},
	{
		"a": 268,
		"b": 256,
		"type": "rail"
	},
	{
		"a": 300,
		"b": 268,
		"nations": "ap",
		"type": "rail"
	},
	{
		"a": 300,
		"b": 267,
		"nations": "s"
	},
	{
		"a": 267,
		"b": 268,
		"nations": "s"
	},
	{
		"a": 267,
		"b": 273,
		"nations": "s"
	},
	{
		"a": 275,
		"b": 259
	},
	{
		"a": 275,
		"b": 266
	},
	{
		"a": 275,
		"b": 273,
		"nations": "s"
	},
	{
		"a": 266,
		"b": 264
	},
	{
		"a": 266,
		"b": 273,
		"nations": "s"
	},
	{
		"a": 264,
		"b": 273
	},
	{
		"a": 264,
		"b": 260
	},
	{
		"a": 264,
		"b": 256,
		"type": "rail"
	},
	{
		"a": 260,
		"b": 259
	},
	{
		"a": 257,
		"b": 256,
		"type": "rail"
	},
	{
		"a": 283,
		"b": 23,
		"nations": "no_tribe",
		"type": "green",
		"crossing": 1
	},
	{
		"a": 283,
		"b": 292,
		"type": "green"
	},
	{
		"a": 14,
		"b": 18,
		"type": "rail",
		"crossing": 2
	},
	{
		"a": 88,
		"b": 95
	},
	{
		"a": 313,
		"b": 298,
		"type": "green"
	},
	{
		"a": 313,
		"b": 299,
		"type": "green"
	},
	{
		"a": 298,
		"b": 292,
		"type": "green"
	},
	{
		"a": 250,
		"b": 112
	},
	{
		"a": 19,
		"b": 30
	},
	{
		"a": 22,
		"b": 12,
		"type": "rail"
	},
	{
		"a": 22,
		"b": 32,
		"type": "rail"
	},
	{
		"a": 2,
		"b": 13
	},
	{
		"a": 184,
		"b": 167,
		"type": "rail"
	},
	{
		"a": 184,
		"b": 168
	},
	{
		"a": 113,
		"b": 288,
		"type": "strait"
	},
	{
		"a": 234,
		"b": 226
	},
	{
		"a": 245,
		"b": 244,
		"nations": "arab",
		"type": "green"
	},
	{
		"a": 151,
		"b": 172
	},
	{
		"a": 199,
		"b": 204
	},
	{
		"a": 169,
		"b": 178
	},
	{
		"a": 178,
		"b": 177
	}
], // Keep raw edges for reference if needed, or structured adj
	pieces: [
	{},
	{
		"id": 1,
		"faction": "ap",
		"nation": "anz",
		"name": "ANZ ANZAC",
		"cf": 4,
		"lf": 3,
		"mf": 4,
		"rcf": 3,
		"rlf": 3,
		"rmf": 4,
		"type": "regular",
		"badge": "blue",
		"piece_class": "LCU",
		"image_full": "ANZAC.png",
		"image_reduced": "ANZACR.png"
	},
	{
		"id": 2,
		"faction": "ap",
		"nation": "anz",
		"name": "ANZ Cavalry #1",
		"cf": 2,
		"lf": 2,
		"mf": 6,
		"rcf": 1,
		"rlf": 2,
		"rmf": 6,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "ANZCDiv.png",
		"image_reduced": "ANZCDivR.png"
	},
	{
		"id": 3,
		"faction": "ap",
		"nation": "anz",
		"name": "ANZ Cavalry #2",
		"cf": 2,
		"lf": 2,
		"mf": 6,
		"rcf": 1,
		"rlf": 2,
		"rmf": 6,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "ANZCDiv.png",
		"image_reduced": "ANZCDivR.png"
	},
	{
		"id": 4,
		"faction": "ap",
		"nation": "anz",
		"name": "ANZ Cavalry #3",
		"cf": 2,
		"lf": 2,
		"mf": 6,
		"rcf": 1,
		"rlf": 2,
		"rmf": 6,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "ANZCDiv.png",
		"image_reduced": "ANZCDivR.png"
	},
	{
		"id": 5,
		"faction": "ap",
		"nation": "anz",
		"name": "ANZ Desert Corps",
		"cf": 3,
		"lf": 3,
		"mf": 5,
		"rcf": 2,
		"rlf": 3,
		"rmf": 5,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "LCU",
		"image_full": "ANZDC.PNG",
		"image_reduced": "ANZDCR.PNG"
	},
	{
		"id": 6,
		"faction": "ap",
		"nation": "anz",
		"name": "ANZ Elite DIV",
		"cf": 3,
		"lf": 2,
		"mf": 4,
		"rcf": 2,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "ANZDiv.png",
		"image_reduced": "ANZDivR.png"
	},
	{
		"id": 7,
		"faction": "ap",
		"nation": "anz",
		"name": "ANZ Imp Camel",
		"cf": 1,
		"lf": 1,
		"mf": 6,
		"rcf": 0,
		"rlf": 1,
		"rmf": 6,
		"type": "regular",
		"badge": "camel",
		"piece_class": "SCU",
		"image_full": "ANZICDiv.png",
		"image_reduced": "ANZICDivR.png"
	},
	{
		"id": 8,
		"faction": "ap",
		"nation": "ar",
		"name": "Arab faisal Revolt",
		"cf": 1,
		"lf": null,
		"mf": 2,
		"rcf": 1,
		"rlf": 1,
		"rmf": 2,
		"type": "irregular",
		"piece_class": "SCU",
		"image_full": "ARFAISAL.png",
		"image_reduced": "ARFAISALR.PNG"
	},
	{
		"id": 9,
		"faction": "ap",
		"nation": "ar",
		"name": "Arab Revolt #1",
		"cf": 1,
		"lf": 1,
		"mf": 1,
		"rcf": 1,
		"rlf": 1,
		"rmf": 1,
		"type": "irregular",
		"piece_class": "SCU",
		"image_full": "ARRVT.png",
		"image_reduced": "ARRVTR.png"
	},
	{
		"id": 10,
		"faction": "ap",
		"nation": "ar",
		"name": "Arab Revolt #2",
		"cf": 1,
		"lf": 1,
		"mf": 1,
		"rcf": 1,
		"rlf": 1,
		"rmf": 1,
		"type": "irregular",
		"piece_class": "SCU",
		"image_full": "ARRVT.png",
		"image_reduced": "ARRVTR.png"
	},
	{
		"id": 11,
		"faction": "ap",
		"nation": "arm",
		"name": "Armenian Uprising",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"symbol": "dot",
		"type": "irregular",
		"piece_class": "SCU",
		"image_full": "ARMUp.png",
		"image_reduced": "ARMUpR.png"
	},
	{
		"id": 12,
		"faction": "ap",
		"nation": "br",
		"name": "BR Allenby HQ",
		"cf": 0,
		"lf": 2,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "hq",
		"piece_class": "SCU",
		"image_full": "BRALNYHQ.png",
		"image_reduced": "BRALNYHQR.png"
	},
	{
		"id": 13,
		"faction": "ap",
		"nation": "br",
		"name": "BR ANA Arab",
		"cf": 2,
		"lf": 2,
		"mf": 2,
		"rcf": 1,
		"rlf": 2,
		"rmf": 2,
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "BRANA.png",
		"image_reduced": "BRANAR.png"
	},
	{
		"id": 14,
		"faction": "ap",
		"nation": "br",
		"name": "BR Cavalry #1",
		"cf": 2,
		"lf": 1,
		"mf": 6,
		"rcf": 1,
		"rlf": 1,
		"rmf": 6,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "BRCDiv.png",
		"image_reduced": "BRCDivR.png"
	},
	{
		"id": 15,
		"faction": "ap",
		"nation": "br",
		"name": "BR Cavalry #2",
		"cf": 2,
		"lf": 1,
		"mf": 6,
		"rcf": 1,
		"rlf": 1,
		"rmf": 6,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "BRCDiv.png",
		"image_reduced": "BRCDivR.png"
	},
	{
		"id": 16,
		"faction": "ap",
		"nation": "br",
		"name": "BR Cavalry #3",
		"cf": 2,
		"lf": 1,
		"mf": 6,
		"rcf": 1,
		"rlf": 1,
		"rmf": 6,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "BRCDiv.png",
		"image_reduced": "BRCDivR.png"
	},
	{
		"id": 17,
		"faction": "ap",
		"nation": "br",
		"name": "BR Cavalry #4",
		"cf": 2,
		"lf": 1,
		"mf": 6,
		"rcf": 1,
		"rlf": 1,
		"rmf": 6,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "BRCDiv.png",
		"image_reduced": "BRCDivR.png"
	},
	{
		"id": 18,
		"faction": "ap",
		"nation": "br",
		"name": "BR DIV #1",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "BRDiv.png",
		"image_reduced": "BRDivR.png"
	},
	{
		"id": 19,
		"faction": "ap",
		"nation": "br",
		"name": "BR DIV #2",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "BRDiv.png",
		"image_reduced": "BRDivR.png"
	},
	{
		"id": 20,
		"faction": "ap",
		"nation": "br",
		"name": "BR DIV #3",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "BRDiv.png",
		"image_reduced": "BRDivR.png"
	},
	{
		"id": 21,
		"faction": "ap",
		"nation": "br",
		"name": "BR DIV #4",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "BRDiv.png",
		"image_reduced": "BRDivR.png"
	},
	{
		"id": 22,
		"faction": "ap",
		"nation": "br",
		"name": "BR DIV #5",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "BRDiv.png",
		"image_reduced": "BRDivR.png"
	},
	{
		"id": 23,
		"faction": "ap",
		"nation": "br",
		"name": "BR DIV #6",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "BRDiv.png",
		"image_reduced": "BRDivR.png"
	},
	{
		"id": 24,
		"faction": "ap",
		"nation": "br",
		"name": "BR DIV #7",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "BRDiv.png",
		"image_reduced": "BRDivR.png"
	},
	{
		"id": 25,
		"faction": "ap",
		"nation": "br",
		"name": "BR Dunsterforce",
		"cf": 1,
		"lf": null,
		"mf": 8,
		"rcf": 0,
		"rlf": 1,
		"rmf": 8,
		"type": "regular",
		"badge": "armored",
		"piece_class": "SCU",
		"image_full": "BRDUNF.png",
		"image_reduced": "BRDUNFR.png"
	},
	{
		"id": 26,
		"faction": "ap",
		"nation": "br",
		"name": "BR Elite DIV #1",
		"cf": 3,
		"lf": 2,
		"mf": 4,
		"rcf": 2,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "BREDiv.png",
		"image_reduced": "BREDivR.png"
	},
	{
		"id": 27,
		"faction": "ap",
		"nation": "br",
		"name": "BR Elite DIV #2",
		"cf": 3,
		"lf": 2,
		"mf": 4,
		"rcf": 2,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "BREDiv.png",
		"image_reduced": "BREDivR.png"
	},
	{
		"id": 28,
		"faction": "ap",
		"nation": "br",
		"name": "BR Elite DIV #3",
		"cf": 3,
		"lf": 2,
		"mf": 4,
		"rcf": 2,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "BREDiv.png",
		"image_reduced": "BREDivR.png"
	},
	{
		"id": 29,
		"faction": "ap",
		"nation": "br",
		"name": "BR Elite DIV #4",
		"cf": 3,
		"lf": 2,
		"mf": 4,
		"rcf": 2,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "BREDiv.png",
		"image_reduced": "BREDivR.png"
	},
	{
		"id": 30,
		"faction": "ap",
		"nation": "br",
		"name": "BR Elite DIV #5",
		"cf": 3,
		"lf": 2,
		"mf": 4,
		"rcf": 2,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "BREDiv.png",
		"image_reduced": "BREDivR.png"
	},
	{
		"id": 31,
		"faction": "ap",
		"nation": "br",
		"name": "BR Elite DIV #6",
		"cf": 3,
		"lf": 2,
		"mf": 4,
		"rcf": 2,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "BREDiv.png",
		"image_reduced": "BREDivR.png"
	},
	{
		"id": 32,
		"faction": "ap",
		"nation": "br",
		"name": "BR IN Garrison #1",
		"cf": 2,
		"lf": 2,
		"mf": 0,
		"rcf": 0,
		"rlf": 2,
		"rmf": 0,
		"region_limit": "I",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "BRINGarr.png",
		"image_reduced": "BRINGarrR.png"
	},
	{
		"id": 33,
		"faction": "ap",
		"nation": "br",
		"name": "BR IN Garrison #2",
		"cf": 2,
		"lf": 2,
		"mf": 0,
		"rcf": 0,
		"rlf": 2,
		"rmf": 0,
		"region_limit": "I",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "BRINGarr.png",
		"image_reduced": "BRINGarrR.png"
	},
	{
		"id": 34,
		"faction": "ap",
		"nation": "br",
		"name": "BR IN Garrison #3",
		"cf": 2,
		"lf": 2,
		"mf": 0,
		"rcf": 0,
		"rlf": 2,
		"rmf": 0,
		"region_limit": "I",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "BRINGarr.png",
		"image_reduced": "BRINGarrR.png"
	},
	{
		"id": 35,
		"faction": "ap",
		"nation": "br",
		"name": "BR IX Corps",
		"cf": 4,
		"lf": 3,
		"mf": 4,
		"rcf": 3,
		"rlf": 3,
		"rmf": 4,
		"type": "regular",
		"badge": "yellow",
		"piece_class": "LCU",
		"image_full": "BRIXC.png",
		"image_reduced": "BRIXCR.png"
	},
	{
		"id": 36,
		"faction": "ap",
		"nation": "br",
		"name": "BR Maude HQ",
		"cf": 0,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 0,
		"rmf": 4,
		"type": "hq",
		"piece_class": "SCU",
		"image_full": "BRMAUDEHQ.png",
		"image_reduced": "BRMAUDEHQR.png"
	},
	{
		"id": 37,
		"faction": "ap",
		"nation": "br",
		"name": "BR Persian Cordon #1",
		"cf": 1,
		"lf": 1,
		"mf": 1,
		"rcf": 0,
		"rlf": 1,
		"rmf": 1,
		"region_limit": "P",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "BRPERC.png",
		"image_reduced": "BRPERCR.png"
	},
	{
		"id": 38,
		"faction": "ap",
		"nation": "br",
		"name": "BR Persian Cordon #2",
		"cf": 1,
		"lf": 1,
		"mf": 1,
		"rcf": 0,
		"rlf": 1,
		"rmf": 1,
		"region_limit": "P",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "BRPERC.png",
		"image_reduced": "BRPERCR.png"
	},
	{
		"id": 39,
		"faction": "ap",
		"nation": "br",
		"name": "BR Persian Cordon #3",
		"cf": 1,
		"lf": 1,
		"mf": 1,
		"rcf": 0,
		"rlf": 1,
		"rmf": 1,
		"region_limit": "P",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "BRPERC.png",
		"image_reduced": "BRPERCR.png"
	},
	{
		"id": 40,
		"faction": "ap",
		"nation": "br",
		"name": "BR Persian Cordon #4",
		"cf": 1,
		"lf": 1,
		"mf": 1,
		"rcf": 0,
		"rlf": 1,
		"rmf": 1,
		"region_limit": "P",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "BRPERC.png",
		"image_reduced": "BRPERCR.png"
	},
	{
		"id": 41,
		"faction": "ap",
		"nation": "br",
		"name": "BR Royal Navy",
		"cf": 1,
		"lf": 1,
		"mf": 8,
		"rcf": 0,
		"rlf": 1,
		"rmf": 8,
		"type": "regular",
		"badge": "armored",
		"piece_class": "SCU",
		"image_full": "BRRNR.png",
		"image_reduced": "BRRNRR.png"
	},
	{
		"id": 42,
		"faction": "ap",
		"nation": "br",
		"name": "BR VIII Corps",
		"cf": 4,
		"lf": 3,
		"mf": 4,
		"rcf": 3,
		"rlf": 3,
		"rmf": 4,
		"type": "regular",
		"badge": "yellow",
		"piece_class": "LCU",
		"image_full": "BRVIIIC.png",
		"image_reduced": "BRVIIICR.png"
	},
	{
		"id": 43,
		"faction": "ap",
		"nation": "br",
		"name": "BR XII Corps",
		"cf": 3,
		"lf": 3,
		"mf": 4,
		"rcf": 2,
		"rlf": 3,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "BRXIIC.png",
		"image_reduced": "BRXIICR.png"
	},
	{
		"id": 44,
		"faction": "ap",
		"nation": "br",
		"name": "BR XVI Corps",
		"cf": 3,
		"lf": 3,
		"mf": 4,
		"rcf": 2,
		"rlf": 3,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "BRXVIC.png",
		"image_reduced": "BRXVICR.png"
	},
	{
		"id": 45,
		"faction": "ap",
		"nation": "br",
		"name": "BR XX Corps",
		"cf": 4,
		"lf": 3,
		"mf": 4,
		"rcf": 3,
		"rlf": 3,
		"rmf": 4,
		"type": "regular",
		"badge": "yellow",
		"piece_class": "LCU",
		"image_full": "BRXXC.png",
		"image_reduced": "BRXXCR.png"
	},
	{
		"id": 46,
		"faction": "ap",
		"nation": "br",
		"name": "BR XXI Corps",
		"cf": 4,
		"lf": 3,
		"mf": 4,
		"rcf": 3,
		"rlf": 3,
		"rmf": 4,
		"type": "regular",
		"badge": "yellow",
		"piece_class": "LCU",
		"image_full": "BRXXIC.png",
		"image_reduced": "BRXXICR.png"
	},
	{
		"id": 48,
		"faction": "ap",
		"nation": "br",
		"name": "BR/PE SPers Rifles",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "SPERSR.png",
		"image_reduced": "SPERSRR.png"
	},
	{
		"id": 49,
		"faction": "ap",
		"nation": "fr",
		"name": "FR Army Orient 1",
		"cf": 3,
		"lf": 3,
		"mf": 3,
		"rcf": 2,
		"rlf": 3,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "FRAO1.png",
		"image_reduced": "FRAO1R.png"
	},
	{
		"id": 50,
		"faction": "ap",
		"nation": "fr",
		"name": "FR Army Orient 2",
		"cf": 3,
		"lf": 3,
		"mf": 3,
		"rcf": 2,
		"rlf": 3,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "FRAO2.png",
		"image_reduced": "FRAO2R.png"
	},
	{
		"id": 51,
		"faction": "ap",
		"nation": "fr",
		"name": "FR D'Esperey HQ",
		"cf": 0,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 0,
		"rmf": 4,
		"type": "hq",
		"piece_class": "SCU",
		"image_full": "FRDESHQ.png",
		"image_reduced": "FRDESHQR.png"
	},
	{
		"id": 52,
		"faction": "ap",
		"nation": "fr",
		"name": "FR DIV #1",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "FRDiv.png",
		"image_reduced": "FRDivR.png"
	},
	{
		"id": 53,
		"faction": "ap",
		"nation": "fr",
		"name": "FR DIV #2",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "FRDiv.png",
		"image_reduced": "FRDivR.png"
	},
	{
		"id": 54,
		"faction": "ap",
		"nation": "fr",
		"name": "FR DIV #3",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "FRDiv.png",
		"image_reduced": "FRDivR.png"
	},
	{
		"id": 55,
		"faction": "ap",
		"nation": "fr",
		"name": "FR DIV #4",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "FRDiv.png",
		"image_reduced": "FRDivR.png"
	},
	{
		"id": 56,
		"faction": "ap",
		"nation": "fr",
		"name": "FR DIV #5",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "FRDiv.png",
		"image_reduced": "FRDivR.png"
	},
	{
		"id": 57,
		"faction": "ap",
		"nation": "fr",
		"name": "FR DIV #6",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "FRDiv.png",
		"image_reduced": "FRDivR.png"
	},
	{
		"id": 58,
		"faction": "ap",
		"nation": "fr",
		"name": "FR DIV #7",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "FRDiv.png",
		"image_reduced": "FRDivR.png"
	},
	{
		"id": 59,
		"faction": "ap",
		"nation": "fr",
		"name": "FR DIV #8",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "FRDiv.png",
		"image_reduced": "FRDivR.png"
	},
	{
		"id": 60,
		"faction": "ap",
		"nation": "gr",
		"name": "GR DIV #1",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "GRDiv.png",
		"image_reduced": "GRDivR.png"
	},
	{
		"id": 61,
		"faction": "ap",
		"nation": "gr",
		"name": "GR DIV #2",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "GRDiv.png",
		"image_reduced": "GRDivR.png"
	},
	{
		"id": 62,
		"faction": "ap",
		"nation": "gr",
		"name": "GR DIV #3",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "GRDiv.png",
		"image_reduced": "GRDivR.png"
	},
	{
		"id": 63,
		"faction": "ap",
		"nation": "gr",
		"name": "GR National Defense",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "BRGRCND.png",
		"image_reduced": "BRGRCNDR.png"
	},
	{
		"id": 64,
		"faction": "ap",
		"nation": "in",
		"name": "IN 15th DIV",
		"cf": 2,
		"lf": 2,
		"mf": 3,
		"rcf": 1,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "IN15Div.png",
		"image_reduced": "IN15DivR.png"
	},
	{
		"id": 65,
		"faction": "ap",
		"nation": "in",
		"name": "IN 17th DIV",
		"cf": 2,
		"lf": 2,
		"mf": 3,
		"rcf": 1,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "IN17Div.png",
		"image_reduced": "IN17DivR.png"
	},
	{
		"id": 66,
		"faction": "ap",
		"nation": "in",
		"name": "IN 18th DIV",
		"cf": 2,
		"lf": 2,
		"mf": 3,
		"rcf": 1,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "IN18Div.png",
		"image_reduced": "IN18DivR.png"
	},
	{
		"id": 67,
		"faction": "ap",
		"nation": "in",
		"name": "IN 2nd Corps",
		"cf": 2,
		"lf": 2,
		"mf": 3,
		"rcf": 1,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "IN2C.png",
		"image_reduced": "IN2CR.png"
	},
	{
		"id": 68,
		"faction": "ap",
		"nation": "in",
		"name": "IN 3rd Corps",
		"cf": 3,
		"lf": 3,
		"mf": 3,
		"rcf": 2,
		"rlf": 3,
		"rmf": 3,
		"type": "regular",
		"badge": "blue",
		"piece_class": "LCU",
		"image_full": "IN3C.png",
		"image_reduced": "IN3CR.png"
	},
	{
		"id": 69,
		"faction": "ap",
		"nation": "in",
		"name": "IN Bikanir Camel",
		"cf": 1,
		"lf": 1,
		"mf": 8,
		"rcf": 0,
		"rlf": 1,
		"rmf": 8,
		"type": "regular",
		"badge": "camel",
		"piece_class": "SCU",
		"image_full": "INBIKANIR.png",
		"image_reduced": "INBIKANIRR.png"
	},
	{
		"id": 70,
		"faction": "ap",
		"nation": "in",
		"name": "IN Cavalry #1",
		"cf": 1,
		"lf": 1,
		"mf": 5,
		"rcf": 0,
		"rlf": 1,
		"rmf": 5,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "INCDiv.png",
		"image_reduced": "INCDivR.png"
	},
	{
		"id": 71,
		"faction": "ap",
		"nation": "in",
		"name": "IN Cavalry #2",
		"cf": 1,
		"lf": 1,
		"mf": 5,
		"rcf": 0,
		"rlf": 1,
		"rmf": 5,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "INCDiv.png",
		"image_reduced": "INCDivR.png"
	},
	{
		"id": 72,
		"faction": "ap",
		"nation": "in",
		"name": "IN Cavalry #3",
		"cf": 1,
		"lf": 1,
		"mf": 5,
		"rcf": 0,
		"rlf": 1,
		"rmf": 5,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "INCDiv.png",
		"image_reduced": "INCDivR.png"
	},
	{
		"id": 73,
		"faction": "ap",
		"nation": "in",
		"name": "IN Cavalry #4",
		"cf": 1,
		"lf": 1,
		"mf": 5,
		"rcf": 0,
		"rlf": 1,
		"rmf": 5,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "INCDiv.png",
		"image_reduced": "INCDivR.png"
	},
	{
		"id": 74,
		"faction": "ap",
		"nation": "in",
		"name": "IN Cavalry #5",
		"cf": 1,
		"lf": 1,
		"mf": 5,
		"rcf": 0,
		"rlf": 1,
		"rmf": 5,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "INCDiv.png",
		"image_reduced": "INCDivR.png"
	},
	{
		"id": 75,
		"faction": "ap",
		"nation": "in",
		"name": "IN Cavalry #6",
		"cf": 1,
		"lf": 1,
		"mf": 5,
		"rcf": 0,
		"rlf": 1,
		"rmf": 5,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "INCDiv.png",
		"image_reduced": "INCDivR.png"
	},
	{
		"id": 76,
		"faction": "ap",
		"nation": "in",
		"name": "IN DIV #1",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "INDiv.png",
		"image_reduced": "INDivR.png"
	},
	{
		"id": 77,
		"faction": "ap",
		"nation": "in",
		"name": "IN DIV #2",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "INDiv.png",
		"image_reduced": "INDivR.png"
	},
	{
		"id": 78,
		"faction": "ap",
		"nation": "in",
		"name": "IN DIV #3",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "INDiv.png",
		"image_reduced": "INDivR.png"
	},
	{
		"id": 79,
		"faction": "ap",
		"nation": "in",
		"name": "IN DIV #4",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "INDiv.png",
		"image_reduced": "INDivR.png"
	},
	{
		"id": 80,
		"faction": "ap",
		"nation": "in",
		"name": "IN DIV #5",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "INDiv.png",
		"image_reduced": "INDivR.png"
	},
	{
		"id": 81,
		"faction": "ap",
		"nation": "in",
		"name": "IN DIV #6",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "INDiv.png",
		"image_reduced": "INDivR.png"
	},
	{
		"id": 82,
		"faction": "ap",
		"nation": "in",
		"name": "IN DIV #7",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "INDiv.png",
		"image_reduced": "INDivR.png"
	},
	{
		"id": 83,
		"faction": "ap",
		"nation": "in",
		"name": "IN Elite DIV #1",
		"cf": 2,
		"lf": 1,
		"mf": 3,
		"rcf": 1,
		"rlf": 1,
		"rmf": 3,
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "INEDiv.png",
		"image_reduced": "INEDivR.png"
	},
	{
		"id": 84,
		"faction": "ap",
		"nation": "in",
		"name": "IN Elite DIV #2",
		"cf": 2,
		"lf": 1,
		"mf": 3,
		"rcf": 1,
		"rlf": 1,
		"rmf": 3,
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "INEDiv.png",
		"image_reduced": "INEDivR.png"
	},
	{
		"id": 85,
		"faction": "ap",
		"nation": "in",
		"name": "IN Elite DIV #3",
		"cf": 2,
		"lf": 1,
		"mf": 3,
		"rcf": 1,
		"rlf": 1,
		"rmf": 3,
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "INEDiv.png",
		"image_reduced": "INEDivR.png"
	},
	{
		"id": 86,
		"faction": "ap",
		"nation": "in",
		"name": "IN Tigris Corps",
		"cf": 2,
		"lf": 2,
		"mf": 3,
		"rcf": 1,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "INTigrisC.png",
		"image_reduced": "INTigrisCR.png"
	},
	{
		"id": 87,
		"faction": "ap",
		"nation": "it",
		"name": "IT DIV",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "ITDiv.png",
		"image_reduced": "ITDivR.png"
	},
	{
		"id": 88,
		"faction": "ap",
		"nation": "ro",
		"name": "RO 1 Army",
		"cf": 2,
		"lf": 2,
		"mf": 3,
		"rcf": 1,
		"rlf": 2,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "RO1A.png",
		"image_reduced": "RO1AR.png"
	},
	{
		"id": 89,
		"faction": "ap",
		"nation": "ro",
		"name": "RO 2 Army",
		"cf": 2,
		"lf": 2,
		"mf": 3,
		"rcf": 1,
		"rlf": 2,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "RO2A.png",
		"image_reduced": "RO2AR.png"
	},
	{
		"id": 90,
		"faction": "ap",
		"nation": "ro",
		"name": "RO 3 Army",
		"cf": 2,
		"lf": 2,
		"mf": 3,
		"rcf": 1,
		"rlf": 2,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "RO3A.png",
		"image_reduced": "RO3AR.png"
	},
	{
		"id": 91,
		"faction": "ap",
		"nation": "ro",
		"name": "RO Cavalry",
		"cf": 1,
		"lf": 1,
		"mf": 5,
		"rcf": 0,
		"rlf": 1,
		"rmf": 5,
		"region_limit": "B",
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "ROCDiv.png",
		"image_reduced": "ROCDivR.png"
	},
	{
		"id": 92,
		"faction": "ap",
		"nation": "ro",
		"name": "RO DIV #1",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RODiv.png",
		"image_reduced": "RODivR.png"
	},
	{
		"id": 93,
		"faction": "ap",
		"nation": "ro",
		"name": "RO DIV #2",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RODiv.png",
		"image_reduced": "RODivR.png"
	},
	{
		"id": 94,
		"faction": "ap",
		"nation": "ro",
		"name": "RO DIV #3",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RODiv.png",
		"image_reduced": "RODivR.png"
	},
	{
		"id": 95,
		"faction": "ap",
		"nation": "ro",
		"name": "RO DIV #4",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RODiv.png",
		"image_reduced": "RODivR.png"
	},
	{
		"id": 96,
		"faction": "ap",
		"nation": "ro",
		"name": "RO DIV #5",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RODiv.png",
		"image_reduced": "RODivR.png"
	},
	{
		"id": 97,
		"faction": "ap",
		"nation": "ro",
		"name": "RO DIV #6",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RODiv.png",
		"image_reduced": "RODivR.png"
	},
	{
		"id": 98,
		"faction": "ap",
		"nation": "ru",
		"name": "RU 2/4 Special",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "RU24SpDiv.png",
		"image_reduced": "RU24SpDivR.png"
	},
	{
		"id": 99,
		"faction": "ap",
		"nation": "ru",
		"name": "RU 6 Army",
		"cf": 4,
		"lf": 2,
		"mf": 4,
		"rcf": 3,
		"rlf": 2,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "LCU",
		"image_full": "RU6A.png",
		"image_reduced": "RU6AR.png"
	},
	{
		"id": 100,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Baratov HQ",
		"cf": 0,
		"lf": 1,
		"mf": 6,
		"rcf": 0,
		"rlf": 0,
		"rmf": 6,
		"type": "hq",
		"piece_class": "SCU",
		"image_full": "RUBarHQ.png",
		"image_reduced": "RUBarHQR.png"
	},
	{
		"id": 101,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Black Sea",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"symbol": "triangle",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "RUBLSeaDiv.png",
		"image_reduced": "RUBLSeaDivR.png"
	},
	{
		"id": 102,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Caucasian Cav",
		"cf": 2,
		"lf": 2,
		"mf": 5,
		"rcf": 1,
		"rlf": 2,
		"rmf": 5,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "LCU",
		"image_full": "RUCaucCC.png",
		"image_reduced": "RUCaucCCR.png"
	},
	{
		"id": 103,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Cavalry #1",
		"cf": 2,
		"lf": 2,
		"mf": 6,
		"rcf": 1,
		"rlf": 1,
		"rmf": 6,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "RUCDiv.png",
		"image_reduced": "RUCDivR.png"
	},
	{
		"id": 104,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Cavalry #2",
		"cf": 2,
		"lf": 2,
		"mf": 6,
		"rcf": 1,
		"rlf": 1,
		"rmf": 6,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "RUCDiv.png",
		"image_reduced": "RUCDivR.png"
	},
	{
		"id": 105,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Cavalry #3",
		"cf": 2,
		"lf": 2,
		"mf": 6,
		"rcf": 1,
		"rlf": 1,
		"rmf": 6,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "RUCDiv.png",
		"image_reduced": "RUCDivR.png"
	},
	{
		"id": 106,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Cavalry #4",
		"cf": 2,
		"lf": 2,
		"mf": 6,
		"rcf": 1,
		"rlf": 1,
		"rmf": 6,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "RUCDiv.png",
		"image_reduced": "RUCDivR.png"
	},
	{
		"id": 107,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Cavalry #5",
		"cf": 2,
		"lf": 2,
		"mf": 6,
		"rcf": 1,
		"rlf": 1,
		"rmf": 6,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "RUCDiv.png",
		"image_reduced": "RUCDivR.png"
	},
	{
		"id": 108,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Cavalry #6",
		"cf": 2,
		"lf": 2,
		"mf": 6,
		"rcf": 1,
		"rlf": 1,
		"rmf": 6,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "RUCDiv.png",
		"image_reduced": "RUCDivR.png"
	},
	{
		"id": 109,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Cavalry #7",
		"cf": 2,
		"lf": 2,
		"mf": 6,
		"rcf": 1,
		"rlf": 1,
		"rmf": 6,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "RUCDiv.png",
		"image_reduced": "RUCDivR.png"
	},
	{
		"id": 110,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Cavalry #8",
		"cf": 2,
		"lf": 2,
		"mf": 6,
		"rcf": 1,
		"rlf": 1,
		"rmf": 6,
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "RUCDiv.png",
		"image_reduced": "RUCDivR.png"
	},
	{
		"id": 111,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Danube Army",
		"cf": 3,
		"lf": 2,
		"mf": 4,
		"rcf": 2,
		"rlf": 2,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "LCU",
		"image_full": "RUDanubeA.png",
		"image_reduced": "RUDanubeAR.png"
	},
	{
		"id": 112,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #1",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 113,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #2",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 114,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #3",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 115,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #4",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 116,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #5",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 117,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #6",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 118,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #7",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 119,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #8",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 120,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #9",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 121,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #10",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 122,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #11",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 123,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #12",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 124,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #13",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 125,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #14",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 126,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #15",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 127,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #16",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 128,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #17",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 129,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #18",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 130,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #19",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 131,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #20",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 132,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #21",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 133,
		"faction": "ap",
		"nation": "ru",
		"name": "RU DIV #22",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUDiv.png",
		"image_reduced": "RUDivR.png"
	},
	{
		"id": 135,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Dobruja",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "LCU",
		"image_full": "RUDobr.png",
		"image_reduced": "RUDobrR.png"
	},
	{
		"id": 136,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Elite DIV #1",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "RUEDiv.png",
		"image_reduced": "RUEDivR.png"
	},
	{
		"id": 137,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Elite DIV #2",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "RUEDiv.png",
		"image_reduced": "RUEDivR.png"
	},
	{
		"id": 138,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Elite DIV #3",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "RUEDiv.png",
		"image_reduced": "RUEDivR.png"
	},
	{
		"id": 139,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Elite DIV #4",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "RUEDiv.png",
		"image_reduced": "RUEDivR.png"
	},
	{
		"id": 140,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Elite DIV #5",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "RUEDiv.png",
		"image_reduced": "RUEDivR.png"
	},
	{
		"id": 141,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Elite DIV #6",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "RUEDiv.png",
		"image_reduced": "RUEDivR.png"
	},
	{
		"id": 141,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Elite DIV #7",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "RUEDiv.png",
		"image_reduced": "RUEDivR.png"
	},
	{
		"id": 142,
		"faction": "ap",
		"nation": "ru",
		"name": "RU I Caucasian",
		"cf": 3,
		"lf": 3,
		"mf": 4,
		"rcf": 2,
		"rlf": 3,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "RUICaucC.png",
		"image_reduced": "RUICaucCR.png"
	},
	{
		"id": 143,
		"faction": "ap",
		"nation": "ru",
		"name": "RU II Turkistani",
		"cf": 3,
		"lf": 3,
		"mf": 4,
		"rcf": 2,
		"rlf": 3,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "RUIITurkC.png",
		"image_reduced": "RUIITurkCR.png"
	},
	{
		"id": 144,
		"faction": "ap",
		"nation": "ru",
		"name": "RU IV Caucasian",
		"cf": 3,
		"lf": 3,
		"mf": 4,
		"rcf": 2,
		"rlf": 3,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "RUIVCaucC.png",
		"image_reduced": "RUIVCaucCR.png"
	},
	{
		"id": 145,
		"faction": "ap",
		"nation": "ru",
		"name": "PE/RU Persian Cossacks",
		"cf": 2,
		"lf": 2,
		"mf": 6,
		"rcf": 1,
		"rlf": 1,
		"rmf": 6,
		"symbol": "triangle",
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "RUPECos.png",
		"image_reduced": "RUPECosR.png"
	},
	{
		"id": 146,
		"faction": "ap",
		"nation": "ru",
		"name": "RU V Caucasian",
		"cf": 3,
		"lf": 3,
		"mf": 4,
		"rcf": 2,
		"rlf": 3,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "RUVCaucC.png",
		"image_reduced": "RUVCaucCR.png"
	},
	{
		"id": 147,
		"faction": "ap",
		"nation": "ru",
		"name": "RU VII Caucasian",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"type": "regular",
		"badge": "yellow",
		"piece_class": "LCU",
		"image_full": "RUVIICaucC.png",
		"image_reduced": "RUVIICaucCR.png"
	},
	{
		"id": 148,
		"faction": "ap",
		"nation": "ru",
		"name": "RU Yudenitch HQ",
		"cf": 0,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 0,
		"rmf": 4,
		"type": "hq",
		"piece_class": "SCU",
		"image_full": "RUYudHQ.png",
		"image_reduced": "RUYudHQR.png"
	},
	{
		"id": 149,
		"faction": "ap",
		"nation": "ru",
		"name": "RU/PE Police North",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"symbol": "triangle",
		"type": "irregular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "RUPEPN.png",
		"image_reduced": "RUPEPNR.png"
	},
	{
		"id": 150,
		"faction": "ap",
		"nation": "ru",
		"name": "RU/SB Yugo Infantry",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "RUSBDiv.png",
		"image_reduced": "RUSBDivR.png"
	},
	{
		"id": 151,
		"faction": "ap",
		"nation": "sb",
		"name": "SB 1 Army",
		"cf": 2,
		"lf": 2,
		"mf": 3,
		"rcf": 1,
		"rlf": 2,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "SB1A.png",
		"image_reduced": "SB1AR.png"
	},
	{
		"id": 152,
		"faction": "ap",
		"nation": "sb",
		"name": "SB 2 Army",
		"cf": 2,
		"lf": 2,
		"mf": 3,
		"rcf": 1,
		"rlf": 2,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "SB2A.png",
		"image_reduced": "SB2AR.png"
	},
	{
		"id": 153,
		"faction": "ap",
		"nation": "sb",
		"name": "SB 3 Army",
		"cf": 2,
		"lf": 2,
		"mf": 3,
		"rcf": 1,
		"rlf": 2,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "SB3A.png",
		"image_reduced": "SB3AR.png"
	},
	{
		"id": 154,
		"faction": "ap",
		"nation": "sb",
		"name": "SB Cavalry",
		"cf": 1,
		"lf": 1,
		"mf": 6,
		"rcf": 0,
		"rlf": 1,
		"rmf": 6,
		"region_limit": "B",
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "SBCDiv.png",
		"image_reduced": "SBCDivR.png"
	},
	{
		"id": 155,
		"faction": "ap",
		"nation": "sb",
		"name": "SB DIV #1",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "SBDiv.png",
		"image_reduced": "SBDivR.png"
	},
	{
		"id": 156,
		"faction": "ap",
		"nation": "sb",
		"name": "SB DIV #2",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "SBDiv.png",
		"image_reduced": "SBDivR.png"
	},
	{
		"id": 157,
		"faction": "ap",
		"nation": "sb",
		"name": "SB DIV #3",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "SBDiv.png",
		"image_reduced": "SBDivR.png"
	},
	{
		"id": 158,
		"faction": "ap",
		"nation": "sb",
		"name": "SB DIV #4",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "SBDiv.png",
		"image_reduced": "SBDivR.png"
	},
	{
		"id": 159,
		"faction": "ap",
		"nation": "sb",
		"name": "SB DIV #5",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "SBDiv.png",
		"image_reduced": "SBDivR.png"
	},
	{
		"id": 160,
		"faction": "ap",
		"nation": "sb",
		"name": "SB DIV #6",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "SBDiv.png",
		"image_reduced": "SBDivR.png"
	},
	{
		"id": 161,
		"faction": "ap",
		"nation": "sb",
		"name": "SB DIV #7",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "SBDiv.png",
		"image_reduced": "SBDivR.png"
	},
	{
		"id": 162,
		"faction": "ap",
		"nation": "sb",
		"name": "SB Garrison",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "SBDiv.png",
		"image_reduced": "SBDivR.png"
	},
	{
		"id": 163,
		"faction": "cp",
		"nation": "ah",
		"name": "AH DIV #1",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "AHDiv.png",
		"image_reduced": "AHDivR.png"
	},
	{
		"id": 164,
		"faction": "cp",
		"nation": "ah",
		"name": "AH DIV #2",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "AHDiv.png",
		"image_reduced": "AHDivR.png"
	},
	{
		"id": 165,
		"faction": "cp",
		"nation": "ah",
		"name": "AH DIV #3",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "AHDiv.png",
		"image_reduced": "AHDivR.png"
	},
	{
		"id": 166,
		"faction": "cp",
		"nation": "ah",
		"name": "AH DIV #4",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "AHDiv.png",
		"image_reduced": "AHDivR.png"
	},
	{
		"id": 167,
		"faction": "cp",
		"nation": "ah",
		"name": "AH DIV #5",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "AHDiv.png",
		"image_reduced": "AHDivR.png"
	},
	{
		"id": 168,
		"faction": "cp",
		"nation": "ah",
		"name": "AH DIV #6",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "AHDiv.png",
		"image_reduced": "AHDivR.png"
	},
	{
		"id": 169,
		"faction": "cp",
		"nation": "ah",
		"name": "AH VI R Corps",
		"cf": 3,
		"lf": 2,
		"mf": 3,
		"rcf": 2,
		"rlf": 2,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "AHVIRC.png",
		"image_reduced": "AHVIRCR.png"
	},
	{
		"id": 170,
		"faction": "cp",
		"nation": "ah",
		"name": "AH VIII Corps",
		"cf": 3,
		"lf": 2,
		"mf": 3,
		"rcf": 2,
		"rlf": 2,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "AHVIIIC.png",
		"image_reduced": "AHVIIICR.png"
	},
	{
		"id": 171,
		"faction": "cp",
		"nation": "ah",
		"name": "AH XXII R Corps",
		"cf": 3,
		"lf": 2,
		"mf": 3,
		"rcf": 2,
		"rlf": 2,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "AHXXIIRC.png",
		"image_reduced": "AHXXIIRCR.png"
	},
	{
		"id": 172,
		"faction": "cp",
		"nation": "arm",
		"name": "Arm Transcas #1",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "ARMTRANSC.png",
		"image_reduced": "ARMTRANSCR.png"
	},
	{
		"id": 173,
		"faction": "cp",
		"nation": "arm",
		"name": "Arm Transcas #2",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "ARMTRANSC.png",
		"image_reduced": "ARMTRANSCR.png"
	},
	{
		"id": 174,
		"faction": "cp",
		"nation": "arm",
		"name": "Arm Transcas #3",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "ARMTRANSC.png",
		"image_reduced": "ARMTRANSCR.png"
	},
	{
		"id": 175,
		"faction": "cp",
		"nation": "bu",
		"name": "BU 1 Army",
		"cf": 3,
		"lf": 2,
		"mf": 3,
		"rcf": 2,
		"rlf": 2,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "BU1A.png",
		"image_reduced": "BU1AR.png"
	},
	{
		"id": 176,
		"faction": "cp",
		"nation": "bu",
		"name": "BU 2 Army",
		"cf": 3,
		"lf": 2,
		"mf": 3,
		"rcf": 2,
		"rlf": 2,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "BU2A.png",
		"image_reduced": "BU2AR.png"
	},
	{
		"id": 177,
		"faction": "cp",
		"nation": "bu",
		"name": "BU 3 Army",
		"cf": 3,
		"lf": 2,
		"mf": 3,
		"rcf": 2,
		"rlf": 2,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "BU3A.png",
		"image_reduced": "BU3AR.png"
	},
	{
		"id": 178,
		"faction": "cp",
		"nation": "bu",
		"name": "BU 4 Army",
		"cf": 3,
		"lf": 2,
		"mf": 3,
		"rcf": 2,
		"rlf": 2,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "BU4A.png",
		"image_reduced": "BU4AR.png"
	},
	{
		"id": 179,
		"faction": "cp",
		"nation": "bu",
		"name": "BU DIV #1",
		"cf": 2,
		"lf": 1,
		"mf": 3,
		"rcf": 1,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "BUDiv.png",
		"image_reduced": "BUDivR.png"
	},
	{
		"id": 180,
		"faction": "cp",
		"nation": "bu",
		"name": "BU DIV #2",
		"cf": 2,
		"lf": 1,
		"mf": 3,
		"rcf": 1,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "BUDiv.png",
		"image_reduced": "BUDivR.png"
	},
	{
		"id": 181,
		"faction": "cp",
		"nation": "bu",
		"name": "BU DIV #3",
		"cf": 2,
		"lf": 1,
		"mf": 3,
		"rcf": 1,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "BUDiv.png",
		"image_reduced": "BUDivR.png"
	},
	{
		"id": 182,
		"faction": "cp",
		"nation": "bu",
		"name": "BU DIV #4",
		"cf": 2,
		"lf": 1,
		"mf": 3,
		"rcf": 1,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "BUDiv.png",
		"image_reduced": "BUDivR.png"
	},
	{
		"id": 183,
		"faction": "cp",
		"nation": "bu",
		"name": "BU DIV #5",
		"cf": 2,
		"lf": 1,
		"mf": 3,
		"rcf": 1,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "BUDiv.png",
		"image_reduced": "BUDivR.png"
	},
	{
		"id": 184,
		"faction": "cp",
		"nation": "bu",
		"name": "BU DIV #6",
		"cf": 2,
		"lf": 1,
		"mf": 3,
		"rcf": 1,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "BUDiv.png",
		"image_reduced": "BUDivR.png"
	},
	{
		"id": 185,
		"faction": "cp",
		"nation": "bu",
		"name": "BU DIV #7",
		"cf": 2,
		"lf": 1,
		"mf": 3,
		"rcf": 1,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "BUDiv.png",
		"image_reduced": "BUDivR.png"
	},
	{
		"id": 186,
		"faction": "cp",
		"nation": "bu",
		"name": "Combined BU/AH Div",
		"cf": 2,
		"lf": 1,
		"mf": 3,
		"rcf": 1,
		"rlf": 1,
		"rmf": 3,
		"region_limit": "B",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "CBUAHDiv.png",
		"image_reduced": "CBUAHDivR.png"
	},
	{
		"id": 187,
		"faction": "cp",
		"nation": "ge",
		"name": "GE Alpenkorps",
		"cf": 3,
		"lf": 2,
		"mf": 4,
		"rcf": 2,
		"rlf": 2,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "GEAlpKdiv.png",
		"image_reduced": "GEAlpKdivR.png"
	},
	{
		"id": 188,
		"faction": "cp",
		"nation": "ge",
		"name": "GE DIV #1",
		"cf": 3,
		"lf": 2,
		"mf": 4,
		"rcf": 2,
		"rlf": 2,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "GEDiv.png",
		"image_reduced": "GEDivR.png"
	},
	{
		"id": 189,
		"faction": "cp",
		"nation": "ge",
		"name": "GE DIV #2",
		"cf": 3,
		"lf": 2,
		"mf": 4,
		"rcf": 2,
		"rlf": 2,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "GEDiv.png",
		"image_reduced": "GEDivR.png"
	},
	{
		"id": 190,
		"faction": "cp",
		"nation": "ge",
		"name": "GE DIV #3",
		"cf": 3,
		"lf": 2,
		"mf": 4,
		"rcf": 2,
		"rlf": 2,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "GEDiv.png",
		"image_reduced": "GEDivR.png"
	},
	{
		"id": 191,
		"faction": "cp",
		"nation": "ge",
		"name": "GE DIV #4",
		"cf": 3,
		"lf": 2,
		"mf": 4,
		"rcf": 2,
		"rlf": 2,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "GEDiv.png",
		"image_reduced": "GEDivR.png"
	},
	{
		"id": 192,
		"faction": "cp",
		"nation": "ge",
		"name": "GE Falkenhayn HQ",
		"cf": 0,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 0,
		"rmf": 4,
		"type": "hq",
		"piece_class": "SCU",
		"image_full": "GEFalkHQ.png",
		"image_reduced": "GEFalkHQR.png"
	},
	{
		"id": 193,
		"faction": "cp",
		"nation": "ge",
		"name": "GE GeoProtect",
		"cf": 1,
		"lf": 1,
		"mf": 0,
		"rcf": 0,
		"rlf": 1,
		"rmf": 0,
		"symbol": "dot",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "GEGEOP.png",
		"image_reduced": "GEGEOPR.png"
	},
	{
		"id": 194,
		"faction": "cp",
		"nation": "ge",
		"name": "GE Hvy Arty",
		"cf": 0,
		"lf": 2,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"symbol": "H",
		"piece_class": "SCU",
		"image_full": "GEHvArty.png",
		"image_reduced": "GEHvArtyR.png"
	},
	{
		"id": 195,
		"faction": "cp",
		"nation": "ge",
		"name": "GE IV R Corps",
		"cf": 3,
		"lf": 3,
		"mf": 4,
		"rcf": 2,
		"rlf": 3,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "GEIVRC.png",
		"image_reduced": "GEIVRCR.png"
	},
	{
		"id": 196,
		"faction": "cp",
		"nation": "ge",
		"name": "GE IX Army",
		"cf": 5,
		"lf": 3,
		"mf": 4,
		"rcf": 4,
		"rlf": 3,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "blue",
		"piece_class": "LCU",
		"image_full": "GEIXA.png",
		"image_reduced": "GEIXAR.png"
	},
	{
		"id": 197,
		"faction": "cp",
		"nation": "ge",
		"name": "GE Mackenson HQ",
		"cf": 0,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 0,
		"rmf": 4,
		"type": "hq",
		"piece_class": "SCU",
		"image_full": "GEMackHQ.png",
		"image_reduced": "GEMackHQR.png"
	},
	{
		"id": 198,
		"faction": "cp",
		"nation": "ge",
		"name": "GE Schmettow",
		"cf": 3,
		"lf": 3,
		"mf": 6,
		"rcf": 2,
		"rlf": 3,
		"rmf": 6,
		"region_limit": "B",
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "LCU",
		"image_full": "GESchmet.png",
		"image_reduced": "GESchmetR.png"
	},
	{
		"id": 199,
		"faction": "cp",
		"nation": "ge",
		"name": "GE Yildrim #1",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"symbol": "Y",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "GEYildDiv.png",
		"image_reduced": "GEYildDivR.png"
	},
	{
		"id": 200,
		"faction": "cp",
		"nation": "ge",
		"name": "GE Yildrim #2",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"symbol": "Y",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "GEYildDiv.png",
		"image_reduced": "GEYildDivR.png"
	},
	{
		"id": 201,
		"faction": "cp",
		"nation": "ge",
		"name": "GE Yildrim #3",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"symbol": "Y",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "GEYildDiv.png",
		"image_reduced": "GEYildDivR.png"
	},
	{
		"id": 202,
		"faction": "cp",
		"nation": "ge",
		"name": "German 11th Army",
		"cf": 4,
		"lf": 3,
		"mf": 4,
		"rcf": 3,
		"rlf": 3,
		"rmf": 4,
		"region_limit": "B",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "LCU",
		"image_full": "GEBUXIA.png",
		"image_reduced": "GEBUXIAR.png"
	},
	{
		"id": 203,
		"faction": "cp",
		"nation": "geo",
		"name": "Geo Transcaucasian #1",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "GEOTRANC.png",
		"image_reduced": "GEOTRANCR.png"
	},
	{
		"id": 204,
		"faction": "cp",
		"nation": "geo",
		"name": "Geo Transcaucasian #2",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "GEOTRANC.png",
		"image_reduced": "GEOTRANCR.png"
	},
	{
		"id": 205,
		"faction": "cp",
		"nation": "pe",
		"name": "PE Uprising",
		"cf": 1,
		"lf": 1,
		"mf": 6,
		"rcf": 0,
		"rlf": 1,
		"rmf": 6,
		"symbol": "dot",
		"type": "irregular",
		"piece_class": "SCU",
		"image_full": "PERUp.png",
		"image_reduced": "PERUPR116R.png"
	},
	{
		"id": 206,
		"faction": "cp",
		"nation": "Re",
		"name": "Afghan Uprising #1",
		"cf": 3,
		"lf": 2,
		"mf": 0,
		"rcf": 2,
		"rlf": 1,
		"rmf": 0,
		"type": "irregular",
		"piece_class": "SCU",
		"image_full": "AfghanUP.png",
		"image_reduced": "AfghanUPR.png"
	},
	{
		"id": 207,
		"faction": "cp",
		"nation": "Re",
		"name": "Afghan Uprising #2",
		"cf": 3,
		"lf": 2,
		"mf": 0,
		"rcf": 2,
		"rlf": 1,
		"rmf": 0,
		"type": "irregular",
		"piece_class": "SCU",
		"image_full": "AfghanUP.png",
		"image_reduced": "AfghanUPR.png"
	},
	{
		"id": 208,
		"faction": "cp",
		"nation": "Re",
		"name": "Afghan Uprising #3",
		"cf": 3,
		"lf": 2,
		"mf": 0,
		"rcf": 2,
		"rlf": 1,
		"rmf": 0,
		"type": "irregular",
		"piece_class": "SCU",
		"image_full": "AfghanUP.png",
		"image_reduced": "AfghanUPR.png"
	},
	{
		"id": 209,
		"faction": "cp",
		"nation": "Re",
		"name": "CAsia Uprising",
		"cf": 2,
		"lf": 2,
		"mf": 0,
		"rcf": 1,
		"rlf": 2,
		"rmf": 0,
		"type": "irregular",
		"piece_class": "SCU",
		"image_full": "CAsiaUP.png",
		"image_reduced": "CAsiaUPR.png"
	},
	{
		"id": 210,
		"faction": "cp",
		"nation": "Re",
		"name": "Egypt Rebel #1",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"type": "irregular",
		"piece_class": "SCU",
		"image_full": "EgyptReb.png",
		"image_reduced": "EgyptRebR.png"
	},
	{
		"id": 211,
		"faction": "cp",
		"nation": "Re",
		"name": "Egypt Rebel #2",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"type": "irregular",
		"piece_class": "SCU",
		"image_full": "EgyptReb.png",
		"image_reduced": "EgyptRebR.png"
	},
	{
		"id": 212,
		"faction": "cp",
		"nation": "Re",
		"name": "Egypt Rebel #3",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"type": "irregular",
		"piece_class": "SCU",
		"image_full": "EgyptReb.png",
		"image_reduced": "EgyptRebR.png"
	},
	{
		"id": 213,
		"faction": "cp",
		"nation": "Re",
		"name": "Indian Mutiny #1",
		"cf": 3,
		"lf": 2,
		"mf": 0,
		"rcf": 2,
		"rlf": 1,
		"rmf": 0,
		"type": "irregular",
		"piece_class": "SCU",
		"image_full": "INMutiny.png",
		"image_reduced": "INMutinyR.png"
	},
	{
		"id": 214,
		"faction": "cp",
		"nation": "Re",
		"name": "Indian Mutiny #2",
		"cf": 3,
		"lf": 2,
		"mf": 0,
		"rcf": 2,
		"rlf": 1,
		"rmf": 0,
		"type": "irregular",
		"piece_class": "SCU",
		"image_full": "INMutiny.png",
		"image_reduced": "INMutinyR.png"
	},
	{
		"id": 215,
		"faction": "cp",
		"nation": "Re",
		"name": "Indian Mutiny #3",
		"cf": 3,
		"lf": 2,
		"mf": 0,
		"rcf": 2,
		"rlf": 1,
		"rmf": 0,
		"type": "irregular",
		"piece_class": "SCU",
		"image_full": "INMutiny.png",
		"image_reduced": "INMutinyR.png"
	},
	{
		"id": 216,
		"faction": "cp",
		"nation": "tr",
		"name": "Bakhtiari",
		"cf": 1,
		"lf": 1,
		"mf": 0,
		"rcf": 0,
		"rlf": 1,
		"rmf": 0,
		"type": "tribe",
		"piece_class": "SCU",
		"image_full": "TBakh.png",
		"image_reduced": "TBakhR.png"
	},
	{
		"id": 217,
		"faction": "cp",
		"nation": "tr",
		"name": "Bawi",
		"cf": 1,
		"lf": 1,
		"mf": 0,
		"rcf": 0,
		"rlf": 1,
		"rmf": 0,
		"type": "tribe",
		"piece_class": "SCU",
		"image_full": "TBawi.png",
		"image_reduced": "TBawiR.png"
	},
	{
		"id": 218,
		"faction": "cp",
		"nation": "tr",
		"name": "Jangali",
		"cf": 2,
		"lf": 2,
		"mf": 1,
		"rcf": 1,
		"rlf": 2,
		"rmf": 1,
		"type": "tribe",
		"piece_class": "SCU",
		"image_full": "TJang.png",
		"image_reduced": "TJangR.png"
	},
	{
		"id": 219,
		"faction": "cp",
		"nation": "tr",
		"name": "Kurds #1",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "tribe",
		"piece_class": "SCU",
		"image_full": "TKurds.png",
		"image_reduced": "TKurdsR.png"
	},
	{
		"id": 220,
		"faction": "cp",
		"nation": "tr",
		"name": "Kurds #2",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "tribe",
		"piece_class": "SCU",
		"image_full": "TKurds.png",
		"image_reduced": "TKurdsR.png"
	},
	{
		"id": 221,
		"faction": "cp",
		"nation": "tr",
		"name": "Laz",
		"cf": 2,
		"lf": 2,
		"mf": 1,
		"rcf": 1,
		"rlf": 2,
		"rmf": 1,
		"type": "tribe",
		"piece_class": "SCU",
		"image_full": "TLaz.png",
		"image_reduced": "TLazR.png"
	},
	{
		"id": 222,
		"faction": "cp",
		"nation": "tr",
		"name": "Marsh #1",
		"cf": 1,
		"lf": 1,
		"mf": 1,
		"rcf": 0,
		"rlf": 1,
		"rmf": 1,
		"type": "tribe",
		"piece_class": "SCU",
		"image_full": "TMarsh.png",
		"image_reduced": "TMarshR.png"
	},
	{
		"id": 223,
		"faction": "cp",
		"nation": "tr",
		"name": "Marsh #2",
		"cf": 1,
		"lf": 1,
		"mf": 1,
		"rcf": 0,
		"rlf": 1,
		"rmf": 1,
		"type": "tribe",
		"piece_class": "SCU",
		"image_full": "TMarsh.png",
		"image_reduced": "TMarshR.png"
	},
	{
		"id": 224,
		"faction": "cp",
		"nation": "tr",
		"name": "NW Frontier",
		"cf": 3,
		"lf": 2,
		"mf": 0,
		"rcf": 2,
		"rlf": 2,
		"rmf": 0,
		"type": "tribe",
		"piece_class": "SCU",
		"image_full": "TNWFront.png",
		"image_reduced": "TNWFrontR.png"
	},
	{
		"id": 225,
		"faction": "cp",
		"nation": "tr",
		"name": "Qashqai",
		"cf": 1,
		"lf": 1,
		"mf": 0,
		"rcf": 0,
		"rlf": 1,
		"rmf": 0,
		"type": "tribe",
		"piece_class": "SCU",
		"image_full": "TQashq.png",
		"image_reduced": "TQashqR.png"
	},
	{
		"id": 226,
		"faction": "cp",
		"nation": "tr",
		"name": "Senussi #1",
		"cf": 2,
		"lf": 1,
		"mf": 3,
		"rcf": 1,
		"rlf": 1,
		"rmf": 3,
		"type": "tribe",
		"piece_class": "SCU",
		"image_full": "TSenu213.png",
		"image_reduced": "TSenu213R.png"
	},
	{
		"id": 227,
		"faction": "cp",
		"nation": "tr",
		"name": "Senussi #2",
		"cf": 1,
		"lf": 1,
		"mf": 3,
		"rcf": 0,
		"rlf": 1,
		"rmf": 3,
		"type": "tribe",
		"piece_class": "SCU",
		"image_full": "TSenu113.png",
		"image_reduced": "TSenu113R.png"
	},
	{
		"id": 228,
		"faction": "cp",
		"nation": "tr",
		"name": "Sinjabi",
		"cf": 1,
		"lf": 2,
		"mf": 0,
		"rcf": 0,
		"rlf": 2,
		"rmf": 0,
		"type": "tribe",
		"piece_class": "SCU",
		"image_full": "TSinj.png",
		"image_reduced": "TSinjR.png"
	},
	{
		"id": 229,
		"faction": "cp",
		"nation": "tr",
		"name": "Tangistani",
		"cf": 1,
		"lf": 1,
		"mf": 0,
		"rcf": 0,
		"rlf": 1,
		"rmf": 0,
		"type": "tribe",
		"piece_class": "SCU",
		"image_full": "TTang.png",
		"image_reduced": "TTangR.png"
	},
	{
		"id": 230,
		"faction": "cp",
		"nation": "tu",
		"name": "TU 1 Caucasian",
		"cf": 3,
		"lf": 3,
		"mf": 3,
		"rcf": 2,
		"rlf": 3,
		"rmf": 3,
		"type": "regular",
		"badge": "yellow",
		"piece_class": "LCU",
		"image_full": "TU1CaucC.png",
		"image_reduced": "TU1CaucCR.png"
	},
	{
		"id": 231,
		"faction": "cp",
		"nation": "tu",
		"name": "TU 2 Caucasian",
		"cf": 3,
		"lf": 3,
		"mf": 3,
		"rcf": 2,
		"rlf": 3,
		"rmf": 3,
		"type": "regular",
		"badge": "yellow",
		"piece_class": "LCU",
		"image_full": "TU2CaucC.png",
		"image_reduced": "TU2CaucCR.png"
	},
	{
		"id": 232,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Army Islam HQ",
		"cf": 0,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 0,
		"rmf": 4,
		"type": "hq",
		"piece_class": "SCU",
		"image_full": "TUAoI.png",
		"image_reduced": "TUAoIR.png"
	},
	{
		"id": 233,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Cavalry #1",
		"cf": 1,
		"lf": 1,
		"mf": 5,
		"rcf": 0,
		"rlf": 1,
		"rmf": 5,
		"symbol": "triangle",
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "TUCDiv.png",
		"image_reduced": "TUCDivR.png"
	},
	{
		"id": 234,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Cavalry #2",
		"cf": 1,
		"lf": 1,
		"mf": 5,
		"rcf": 0,
		"rlf": 1,
		"rmf": 5,
		"symbol": "triangle",
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "TUCDiv.png",
		"image_reduced": "TUCDivR.png"
	},
	{
		"id": 235,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Cavalry #3",
		"cf": 1,
		"lf": 1,
		"mf": 5,
		"rcf": 0,
		"rlf": 1,
		"rmf": 5,
		"symbol": "triangle",
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "TUCDiv.png",
		"image_reduced": "TUCDivR.png"
	},
	{
		"id": 236,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Cavalry #4",
		"cf": 1,
		"lf": 1,
		"mf": 5,
		"rcf": 0,
		"rlf": 1,
		"rmf": 5,
		"symbol": "triangle",
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "TUCDiv.png",
		"image_reduced": "TUCDivR.png"
	},
	{
		"id": 237,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Cavalry #5",
		"cf": 1,
		"lf": 1,
		"mf": 5,
		"rcf": 0,
		"rlf": 1,
		"rmf": 5,
		"symbol": "triangle",
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "TUCDiv.png",
		"image_reduced": "TUCDivR.png"
	},
	{
		"id": 238,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Cavalry #6",
		"cf": 1,
		"lf": 1,
		"mf": 5,
		"rcf": 0,
		"rlf": 1,
		"rmf": 5,
		"symbol": "triangle",
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "TUCDiv.png",
		"image_reduced": "TUCDivR.png"
	},
	{
		"id": 239,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #1",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 240,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #10",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 241,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #11",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 242,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #12",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 243,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #13",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 244,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #14",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 245,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #15",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 246,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #16",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 247,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #17",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 248,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #18",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 249,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #2",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 250,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #3",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 251,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #4",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 252,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #5",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 253,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #6",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 254,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #7",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 255,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #8",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 256,
		"faction": "cp",
		"nation": "tu",
		"name": "TU DIV #9",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUDiv.png",
		"image_reduced": "TUDivR.png"
	},
	{
		"id": 257,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Elite DIV #1",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"symbol": "triangle",
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "TUEDiv.png",
		"image_reduced": "TUEDivR.png"
	},
	{
		"id": 258,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Elite DIV #10",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"symbol": "triangle",
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "TUEDiv.png",
		"image_reduced": "TUEDivR.png"
	},
	{
		"id": 259,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Elite DIV #2",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"symbol": "triangle",
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "TUEDiv.png",
		"image_reduced": "TUEDivR.png"
	},
	{
		"id": 260,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Elite DIV #3",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"symbol": "triangle",
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "TUEDiv.png",
		"image_reduced": "TUEDivR.png"
	},
	{
		"id": 261,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Elite DIV #4",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"symbol": "triangle",
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "TUEDiv.png",
		"image_reduced": "TUEDivR.png"
	},
	{
		"id": 262,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Elite DIV #5",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"symbol": "triangle",
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "TUEDiv.png",
		"image_reduced": "TUEDivR.png"
	},
	{
		"id": 263,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Elite DIV #6",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"symbol": "triangle",
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "TUEDiv.png",
		"image_reduced": "TUEDivR.png"
	},
	{
		"id": 264,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Elite DIV #7",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"symbol": "triangle",
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "TUEDiv.png",
		"image_reduced": "TUEDivR.png"
	},
	{
		"id": 265,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Elite DIV #8",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"symbol": "triangle",
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "TUEDiv.png",
		"image_reduced": "TUEDivR.png"
	},
	{
		"id": 266,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Elite DIV #9",
		"cf": 2,
		"lf": 2,
		"mf": 4,
		"rcf": 1,
		"rlf": 2,
		"rmf": 4,
		"symbol": "triangle",
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "TUEDiv.png",
		"image_reduced": "TUEDivR.png"
	},
	{
		"id": 267,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Enver HQ",
		"cf": 0,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 0,
		"rmf": 4,
		"type": "hq",
		"piece_class": "SCU",
		"image_full": "TUAoI.png",
		"image_reduced": "TUAoIR.png"
	},
	{
		"id": 268,
		"faction": "cp",
		"nation": "tu",
		"name": "TU I Corps",
		"cf": 3,
		"lf": 2,
		"mf": 3,
		"rcf": 2,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "TUIC.png",
		"image_reduced": "TUICR.png"
	},
	{
		"id": 269,
		"faction": "cp",
		"nation": "tu",
		"name": "TU II Corps",
		"cf": 3,
		"lf": 2,
		"mf": 3,
		"rcf": 2,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "TUIIC.png",
		"image_reduced": "TUIICR.png"
	},
	{
		"id": 270,
		"faction": "cp",
		"nation": "tu",
		"name": "TU III Corps",
		"cf": 4,
		"lf": 3,
		"mf": 4,
		"rcf": 3,
		"rlf": 3,
		"rmf": 4,
		"symbol": "triangle",
		"type": "regular",
		"badge": "blue",
		"piece_class": "LCU",
		"image_full": "TUIIIC.png",
		"image_reduced": "TUIIICR.png"
	},
	{
		"id": 271,
		"faction": "cp",
		"nation": "tu",
		"name": "TU IV Corps",
		"cf": 3,
		"lf": 2,
		"mf": 3,
		"rcf": 2,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "TUIVC.png",
		"image_reduced": "TUIVCR.png"
	},
	{
		"id": 272,
		"faction": "cp",
		"nation": "tu",
		"name": "TU IX Corps",
		"cf": 3,
		"lf": 2,
		"mf": 3,
		"rcf": 2,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "TUIXC.png",
		"image_reduced": "TUIXCR.png"
	},
	{
		"id": 273,
		"faction": "cp",
		"nation": "tu",
		"name": "TU Stanke Bey",
		"cf": 2,
		"lf": null,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"symbol": "dot",
		"type": "regular",
		"badge": "yellow",
		"piece_class": "SCU",
		"image_full": "TUStBey.png",
		"image_reduced": "TUStBeyR.png"
	},
	{
		"id": 274,
		"faction": "cp",
		"nation": "tu",
		"name": "TU V Corps",
		"cf": 3,
		"lf": 2,
		"mf": 3,
		"rcf": 2,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "TUVC.png",
		"image_reduced": "TUVCR.png"
	},
	{
		"id": 275,
		"faction": "cp",
		"nation": "tu",
		"name": "TU X Corps",
		"cf": 3,
		"lf": 2,
		"mf": 3,
		"rcf": 2,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "TUXC.png",
		"image_reduced": "TUXCR.png"
	},
	{
		"id": 276,
		"faction": "cp",
		"nation": "tu",
		"name": "TU XI Corps",
		"cf": 3,
		"lf": 2,
		"mf": 3,
		"rcf": 2,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "TUXIC.png",
		"image_reduced": "TUXICR.png"
	},
	{
		"id": 277,
		"faction": "cp",
		"nation": "tu",
		"name": "TU XIV Corps",
		"cf": 3,
		"lf": 3,
		"mf": 3,
		"rcf": 2,
		"rlf": 3,
		"rmf": 3,
		"type": "regular",
		"badge": "yellow",
		"piece_class": "LCU",
		"image_full": "TUXIVC.png",
		"image_reduced": "TUXIVCR.png"
	},
	{
		"id": 278,
		"faction": "cp",
		"nation": "tu",
		"name": "TU XV Corps",
		"cf": 3,
		"lf": 3,
		"mf": 3,
		"rcf": 2,
		"rlf": 3,
		"rmf": 3,
		"type": "regular",
		"badge": "yellow",
		"piece_class": "LCU",
		"image_full": "TUXVC.png",
		"image_reduced": "TUXVCR.png"
	},
	{
		"id": 279,
		"faction": "cp",
		"nation": "tu",
		"name": "TU XVI Corps",
		"cf": 3,
		"lf": 3,
		"mf": 3,
		"rcf": 2,
		"rlf": 3,
		"rmf": 3,
		"type": "regular",
		"badge": "yellow",
		"piece_class": "LCU",
		"image_full": "TUXVIC.png",
		"image_reduced": "TUXVICR.png"
	},
	{
		"id": 280,
		"faction": "cp",
		"nation": "tu",
		"name": "TU XVII Corps",
		"cf": 3,
		"lf": 2,
		"mf": 3,
		"rcf": 2,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "TUXVIIC.png",
		"image_reduced": "TUXVIICR.png"
	},
	{
		"id": 281,
		"faction": "cp",
		"nation": "tu",
		"name": "TU XX Corps",
		"cf": 3,
		"lf": 2,
		"mf": 3,
		"rcf": 2,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "TUXXC.png",
		"image_reduced": "TUXXCR.png"
	},
	{
		"id": 282,
		"faction": "cp",
		"nation": "tu",
		"name": "TU XXII Corps",
		"cf": 3,
		"lf": 3,
		"mf": 3,
		"rcf": 2,
		"rlf": 3,
		"rmf": 3,
		"type": "regular",
		"badge": "yellow",
		"piece_class": "LCU",
		"image_full": "TUXXIIC.png",
		"image_reduced": "TUXXIICR.png"
	},
	{
		"id": 283,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A Camel Corps",
		"cf": 1,
		"lf": 1,
		"mf": 8,
		"rcf": 0,
		"rlf": 1,
		"rmf": 8,
		"symbol": "triangle",
		"type": "regular",
		"badge": "camel",
		"piece_class": "SCU",
		"image_full": "TUACCDiv.png",
		"image_reduced": "TUACCDivR.png"
	},
	{
		"id": 284,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A Cavalry",
		"cf": 1,
		"lf": 1,
		"mf": 5,
		"rcf": 0,
		"rlf": 1,
		"rmf": 5,
		"symbol": "triangle",
		"type": "regular",
		"badge": "cavalry",
		"piece_class": "SCU",
		"image_full": "TUACDiv.png",
		"image_reduced": "TUACDivR.png"
	},
	{
		"id": 285,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #1",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 286,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #2",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 287,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #3",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 288,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #4",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 289,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #5",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 290,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #6",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 291,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #7",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 292,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #8",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 293,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #9",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 294,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #10",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 295,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #11",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 296,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #12",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 297,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #13",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 298,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #14",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 299,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #15",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 300,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #16",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 301,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #17",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 302,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #18",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 303,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #19",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 304,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A DIV #20",
		"cf": 1,
		"lf": 1,
		"mf": 4,
		"rcf": 0,
		"rlf": 1,
		"rmf": 4,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "SCU",
		"image_full": "TUADiv.png",
		"image_reduced": "TUADivR.png"
	},
	{
		"id": 305,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A Elite DIV #1",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"symbol": "triangle",
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "TUAEDiv.png",
		"image_reduced": "TUAEDivR.png"
	},
	{
		"id": 306,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A Elite DIV #2",
		"cf": 2,
		"lf": 1,
		"mf": 4,
		"rcf": 1,
		"rlf": 1,
		"rmf": 4,
		"symbol": "triangle",
		"type": "regular",
		"badge": "blue",
		"piece_class": "SCU",
		"image_full": "TUAEDiv.png",
		"image_reduced": "TUAEDivR.png"
	},
	{
		"id": 307,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A Left Wing Gp",
		"cf": 2,
		"lf": 2,
		"mf": 3,
		"rcf": 1,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "TUALWG.png",
		"image_reduced": "TUALWGR.png"
	},
	{
		"id": 308,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A VI Corps",
		"cf": 2,
		"lf": 2,
		"mf": 3,
		"rcf": 1,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "TUAVIC.png",
		"image_reduced": "TUAVICR.png"
	},
	{
		"id": 309,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A VIII Corps",
		"cf": 2,
		"lf": 2,
		"mf": 3,
		"rcf": 1,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "TUAVIIIC.png",
		"image_reduced": "TUAVIIICR.png"
	},
	{
		"id": 310,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A XII Corps",
		"cf": 2,
		"lf": 2,
		"mf": 3,
		"rcf": 1,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "TUAXIIC.png",
		"image_reduced": "TUAXIICR.png"
	},
	{
		"id": 311,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A XIII Corps",
		"cf": 2,
		"lf": 2,
		"mf": 3,
		"rcf": 1,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "TUAXIIIC.png",
		"image_reduced": "TUAXIIICR.png"
	},
	{
		"id": 312,
		"faction": "cp",
		"nation": "tua",
		"name": "TU-A XVIII Corps",
		"cf": 2,
		"lf": 2,
		"mf": 3,
		"rcf": 1,
		"rlf": 2,
		"rmf": 3,
		"type": "regular",
		"badge": "infantry",
		"piece_class": "LCU",
		"image_full": "TUAXVIIIC.png",
		"image_reduced": "TUAXVIIICR.png"
	}
],
	cards: [
	{},
	{
		"num": 1,
		"faction": "ap",
		"commitment": "mobilization",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"ws": 2,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "英俄突袭",
		"event": "RUSSO-BRITISH ASSAULT"
	},
	{
		"num": 2,
		"faction": "ap",
		"commitment": "mobilization",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"ws": 1,
		"rp_ru": 1,
		"rp_in": 1,
		"name": "澳新增援",
		"event": "ANZAC REINFORCEMENTS"
	},
	{
		"num": 3,
		"faction": "ap",
		"commitment": "mobilization",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"rp_ru": 1,
		"rp_in": 1,
		"name": "埃及政变",
		"event": "EGYPTIAN COUP"
	},
	{
		"num": 4,
		"faction": "ap",
		"commitment": "mobilization",
		"ops": 2,
		"sr": 2,
		"cc": true,
		"rp_ru": 1,
		"rp_in": 1,
		"name": "海岸炮击",
		"event": "SHORE BOMBARDMENT CC"
	},
	{
		"num": 5,
		"faction": "ap",
		"commitment": "mobilization",
		"ops": 2,
		"sr": 2,
		"cc": true,
		"rp_ru": 1,
		"rp_in": 1,
		"name": "亚美尼亚志愿队",
		"event": "ARMENIAN DRUZHINY CC"
	},
	{
		"num": 6,
		"faction": "ap",
		"commitment": "mobilization",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"cc": true,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "坚韧不拔",
		"event": "PUGNACITY AND TENACITY CC"
	},
	{
		"num": 7,
		"faction": "ap",
		"commitment": "mobilization",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "恩维尔东方攻势",
		"event": "ENVER GOES EAST"
	},
	{
		"num": 8,
		"faction": "ap",
		"commitment": "mobilization",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"rp_ru": 1,
		"rp_in": 1,
		"name": "秘密条约",
		"event": "SECRET TREATY"
	},
	{
		"num": 9,
		"faction": "ap",
		"commitment": "mobilization",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "俄国势力范围",
		"event": "SPHERE OF INFLUENCE"
	},
	{
		"num": 10,
		"faction": "ap",
		"commitment": "mobilization",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "俄国增援",
		"event": "RUSSIAN REINFORCEMENTS"
	},
	{
		"num": 11,
		"faction": "ap",
		"commitment": "mobilization",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "皇家海军封锁",
		"event": "ROYAL NAVY BLOCKADE"
	},
	{
		"num": 12,
		"faction": "ap",
		"commitment": "mobilization",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"rp_a": 1,
		"rp_br": 2,
		"rp_ru": 3,
		"rp_in": 2,
		"name": "亚历山大计划",
		"event": "PROJECT ALEXANDRIA"
	},
	{
		"num": 13,
		"faction": "ap",
		"commitment": "mobilization",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"ws": 1,
		"rp_a": 1,
		"rp_br": 2,
		"rp_ru": 3,
		"rp_in": 2,
		"name": "丘吉尔胜出",
		"event": "CHURCHILL PREVAILS"
	},
	{
		"num": 14,
		"faction": "ap",
		"commitment": "mobilization",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"ws": 2,
		"rp_a": 1,
		"rp_br": 2,
		"rp_ru": 3,
		"rp_in": 2,
		"name": "基钦纳",
		"event": "KITCHENER"
	},
	{
		"num": 15,
		"faction": "ap",
		"commitment": "limited",
		"ops": 2,
		"sr": 2,
		"cc": true,
		"rp_ru": 1,
		"rp_in": 1,
		"name": "廓尔喀人",
		"event": "GURKHAS CC"
	},
	{
		"num": 16,
		"faction": "ap",
		"commitment": "limited",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"rp_ru": 1,
		"rp_in": 1,
		"name": "阿拉伯起义",
		"event": "ARAB REVOLT"
	},
	{
		"num": 17,
		"faction": "ap",
		"commitment": "limited",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"rp_ru": 1,
		"rp_in": 1,
		"name": "盟军团结",
		"event": "ALLIED SOLIDARITY"
	},
	{
		"num": 18,
		"faction": "ap",
		"commitment": "limited",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"rp_ru": 1,
		"rp_in": 1,
		"name": "劳伦斯",
		"event": "LAWRENCE"
	},
	{
		"num": 19,
		"faction": "ap",
		"commitment": "limited",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"rp_ru": 1,
		"rp_in": 1,
		"name": "默里接管指挥权",
		"event": "MURRAY TAKES COMMAND"
	},
	{
		"num": 20,
		"faction": "ap",
		"commitment": "limited",
		"ops": 2,
		"sr": 2,
		"cc": true,
		"rp_ru": 1,
		"rp_in": 1,
		"name": "装甲车",
		"event": "ARMORED CARS CC"
	},
	{
		"num": 21,
		"faction": "ap",
		"commitment": "limited",
		"ops": 2,
		"sr": 2,
		"cc": true,
		"rp_ru": 1,
		"rp_in": 1,
		"name": "不留活口",
		"event": "NO PRISONERS CC"
	},
	{
		"num": 22,
		"faction": "ap",
		"commitment": "limited",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"ws": 1,
		"rp_a": 1,
		"rp_br": 2,
		"rp_ru": 3,
		"rp_in": 2,
		"name": "基钦纳入侵",
		"event": "KITCHENER'S INVASION"
	},
	{
		"num": 23,
		"faction": "ap",
		"commitment": "limited",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "尼古拉大公抵达第比利斯",
		"event": "GRAND DUKE TO TIFLIS"
	},
	{
		"num": 24,
		"faction": "ap",
		"commitment": "limited",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "塞尔维亚人重返",
		"event": "THE SERBS RETURN!"
	},
	{
		"num": 25,
		"faction": "ap",
		"commitment": "limited",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "俄国增援",
		"event": "RUSSIAN REINFORCEMENTS"
	},
	{
		"num": 26,
		"faction": "ap",
		"commitment": "limited",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "印度增援",
		"event": "INDIAN REINFORCEMENTS"
	},
	{
		"num": 27,
		"faction": "ap",
		"commitment": "limited",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "让法国人流血",
		"event": "LET THE FRENCH BLEED"
	},
	{
		"num": 28,
		"faction": "ap",
		"commitment": "limited",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"cc": true,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "莫德",
		"event": "MAUDE CC"
	},
	{
		"num": 29,
		"faction": "ap",
		"commitment": "limited",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"ws": 1,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "罗马尼亚",
		"event": "ROMANIA"
	},
	{
		"num": 30,
		"faction": "ap",
		"commitment": "limited",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"ws": 1,
		"rp_a": 1,
		"rp_br": 2,
		"rp_ru": 3,
		"rp_in": 2,
		"name": "加里波利入侵",
		"event": "GALLIPOLI INVASION"
	},
	{
		"num": 31,
		"faction": "ap",
		"commitment": "limited",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"ws": 1,
		"rp_a": 1,
		"rp_br": 2,
		"rp_ru": 3,
		"rp_in": 2,
		"name": "俄国冬季攻势",
		"event": "RUSSIAN WINTER OFFENSIVE"
	},
	{
		"num": 32,
		"faction": "ap",
		"commitment": "limited",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"rp_a": 1,
		"rp_br": 2,
		"rp_ru": 3,
		"rp_in": 2,
		"name": "亚美尼亚起义",
		"event": "ARMENIAN UPRISING"
	},
	{
		"num": 33,
		"faction": "ap",
		"commitment": "limited",
		"ops": 5,
		"sr": 5,
		"remove": true,
		"ws": 2,
		"rp_a": 2,
		"rp_br": 2,
		"rp_ru": 4,
		"rp_in": 3,
		"name": "阿斯奎斯-劳合乔治联合政府",
		"event": "ASQUITH/LLOYD GEORGE COALITION"
	},
	{
		"num": 34,
		"faction": "ap",
		"commitment": "limited",
		"ops": 5,
		"sr": 5,
		"remove": true,
		"ws": 2,
		"rp_a": 2,
		"rp_br": 2,
		"rp_ru": 4,
		"rp_in": 3,
		"name": "萨洛尼卡入侵",
		"event": "SALONIKA INVASION"
	},
	{
		"num": 35,
		"faction": "ap",
		"commitment": "total",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"rp_ru": 1,
		"rp_in": 1,
		"name": "英国增援",
		"event": "BRITISH REINFORCEMENTS"
	},
	{
		"num": 36,
		"faction": "ap",
		"commitment": "total",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"rp_ru": 1,
		"rp_in": 1,
		"name": "印度增援",
		"event": "INDIAN REINFORCEMENTS"
	},
	{
		"num": 37,
		"faction": "ap",
		"commitment": "total",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"rp_ru": 1,
		"rp_in": 1,
		"name": "俄国增援",
		"event": "RUSSIAN REINFORCEMENTS"
	},
	{
		"num": 38,
		"faction": "ap",
		"commitment": "total",
		"ops": 2,
		"sr": 2,
		"cc": true,
		"rp_ru": 1,
		"rp_in": 1,
		"name": "皇家空军",
		"event": "ROYAL FLYING CORPS CC"
	},
	{
		"num": 39,
		"faction": "ap",
		"commitment": "total",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"cc": true,
		"rp_ru": 1,
		"rp_in": 1,
		"name": "坦克",
		"event": "TANKS CC"
	},
	{
		"num": 40,
		"faction": "ap",
		"commitment": "total",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "不冻港",
		"event": "WARM WATER PORT"
	},
	{
		"num": 41,
		"faction": "ap",
		"commitment": "total",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"ws": 1,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "贝尔福宣言",
		"event": "BALFOUR DECLARATION"
	},
	{
		"num": 42,
		"faction": "ap",
		"commitment": "total",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "圣诞节前收复圣城",
		"event": "&quot;JERUSALEM BY CHRISTMAS&quot;"
	},
	{
		"num": 43,
		"faction": "ap",
		"commitment": "total",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"ws": 1,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "俄国增援",
		"event": "RUSSIAN REINFORCEMENTS"
	},
	{
		"num": 44,
		"faction": "ap",
		"commitment": "total",
		"ops": 3,
		"sr": 4,
		"cc": true,
		"rp_br": 1,
		"rp_ru": 2,
		"rp_in": 1,
		"name": "巴尔干厌战",
		"event": "WAR WEARY BALKANS CC"
	},
	{
		"num": 45,
		"faction": "ap",
		"commitment": "total",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"ws": 1,
		"rp_a": 1,
		"rp_br": 2,
		"rp_ru": 3,
		"rp_in": 2,
		"name": "希腊",
		"event": "GREECE"
	},
	{
		"num": 46,
		"faction": "ap",
		"commitment": "total",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"rp_a": 1,
		"rp_br": 2,
		"rp_ru": 3,
		"rp_in": 2,
		"name": "阿拉伯人背弃",
		"event": "ARAB DESERTION"
	},
	{
		"num": 47,
		"faction": "ap",
		"commitment": "total",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"rp_a": 1,
		"rp_br": 2,
		"rp_ru": 3,
		"rp_in": 2,
		"name": "印度增援",
		"event": "INDIAN REINFORCEMENTS"
	},
	{
		"num": 48,
		"faction": "ap",
		"commitment": "total",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"rp_a": 1,
		"rp_br": 2,
		"rp_ru": 3,
		"rp_in": 2,
		"name": "土耳其厌战",
		"event": "TURKISH WAR WEARINESS"
	},
	{
		"num": 49,
		"faction": "ap",
		"commitment": "total",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"cc": true,
		"rp_a": 1,
		"rp_br": 2,
		"rp_ru": 3,
		"rp_in": 2,
		"name": "集群骑兵冲锋",
		"event": "MASSED CAVALRY CHARGE CC"
	},
	{
		"num": 50,
		"faction": "ap",
		"commitment": "total",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"cc": true,
		"rp_a": 1,
		"rp_br": 2,
		"rp_ru": 3,
		"rp_in": 2,
		"name": "竭尽全力",
		"event": "PUSH TO THE BREAKING POINT CC"
	},
	{
		"num": 51,
		"faction": "ap",
		"commitment": "total",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"cc": true,
		"rp_a": 1,
		"rp_br": 2,
		"rp_ru": 3,
		"rp_in": 2,
		"name": "背包计谋",
		"event": "HAVERSACK RUSE CC"
	},
	{
		"num": 52,
		"faction": "ap",
		"commitment": "total",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"cc": true,
		"rp_a": 1,
		"rp_br": 2,
		"rp_ru": 3,
		"rp_in": 2,
		"name": "前后佯动",
		"event": "MARCH AND COUNTERMARCH CC"
	},
	{
		"num": 53,
		"faction": "ap",
		"commitment": "total",
		"ops": 5,
		"sr": 5,
		"remove": true,
		"ws": 1,
		"rp_a": 2,
		"rp_br": 2,
		"rp_ru": 4,
		"rp_in": 3,
		"name": "德斯佩雷",
		"event": "D'ESPEREY"
	},
	{
		"num": 54,
		"faction": "ap",
		"commitment": "total",
		"ops": 5,
		"sr": 5,
		"remove": true,
		"ws": 2,
		"rp_a": 2,
		"rp_br": 2,
		"rp_ru": 4,
		"rp_in": 3,
		"name": "艾伦比",
		"event": "ALLENBY"
	},
	{
		"num": 55,
		"faction": "ap",
		"commitment": "total",
		"ops": 5,
		"sr": 5,
		"remove": true,
		"ws": 2,
		"rp_a": 2,
		"rp_br": 2,
		"rp_ru": 4,
		"rp_in": 3,
		"name": "劳合乔治接管指挥权",
		"event": "LLOYD GEORGE TAKES COMMAND"
	},
	{
		"num": 56,
		"faction": "cp",
		"commitment": "mobilization",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"ws": 2,
		"rp_ah": 1,
		"rp_ge": 2,
		"rp_tu": 3,
		"name": "圣战",
		"event": "JIHAD"
	},
	{
		"num": 57,
		"faction": "cp",
		"commitment": "mobilization",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"rp_tu": 1,
		"name": "新兵征募",
		"event": "FRESH RECRUITS"
	},
	{
		"num": 58,
		"faction": "cp",
		"commitment": "mobilization",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"rp_tu": 1,
		"name": "恩维尔坐镇君士坦丁堡",
		"event": "ENVER TO CONSTANTINOPLE"
	},
	{
		"num": 59,
		"faction": "cp",
		"commitment": "mobilization",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"cc": true,
		"rp_tu": 1,
		"name": "前线预备役",
		"event": "RESERVES TO THE FRONT CC"
	},
	{
		"num": 60,
		"faction": "cp",
		"commitment": "mobilization",
		"ops": 2,
		"sr": 2,
		"cc": true,
		"rp_tu": 1,
		"name": "德国最高司令部",
		"event": "GERMAN HIGH COMMAND CC"
	},
	{
		"num": 61,
		"faction": "cp",
		"commitment": "mobilization",
		"ops": 2,
		"sr": 2,
		"cc": true,
		"rp_tu": 1,
		"name": "沙尘暴和疟蚊",
		"event": "SANDSTORMS &amp; MOSQUITOES CC"
	},
	{
		"num": 62,
		"faction": "cp",
		"commitment": "mobilization",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"ws": 1,
		"rp_ge": 1,
		"rp_tu": 2,
		"name": "戈本号",
		"event": "GOEBEN"
	},
	{
		"num": 63,
		"faction": "cp",
		"commitment": "mobilization",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"ws": 1,
		"rp_ge": 1,
		"rp_tu": 2,
		"name": "德国军事顾问",
		"event": "GERMAN MILITARY MISSION"
	},
	{
		"num": 64,
		"faction": "cp",
		"commitment": "mobilization",
		"ops": 3,
		"sr": 4,
		"rp_ge": 1,
		"rp_tu": 2,
		"name": "议会质询",
		"event": "PARLIAMENTARY INQUIRY"
	},
	{
		"num": 65,
		"faction": "cp",
		"commitment": "mobilization",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"rp_ge": 1,
		"rp_tu": 2,
		"name": "波斯攻势",
		"event": "PERSIAN PUSH"
	},
	{
		"num": 66,
		"faction": "cp",
		"commitment": "mobilization",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"cc": true,
		"rp_ge": 1,
		"rp_tu": 2,
		"name": "回援第比利斯",
		"event": "SAVE TIFLIS CC"
	},
	{
		"num": 67,
		"faction": "cp",
		"commitment": "mobilization",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"rp_ah": 1,
		"rp_ge": 2,
		"rp_tu": 3,
		"name": "解放苏伊士",
		"event": "LIBERATE SUEZ"
	},
	{
		"num": 68,
		"faction": "cp",
		"commitment": "mobilization",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"ws": 2,
		"rp_ah": 1,
		"rp_ge": 2,
		"rp_tu": 3,
		"name": "泛突厥主义",
		"event": "PAN-TURKISM"
	},
	{
		"num": 69,
		"faction": "cp",
		"commitment": "mobilization",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"rp_ah": 1,
		"rp_ge": 2,
		"rp_tu": 3,
		"name": "印度哗变",
		"event": "INDIAN MUTINY"
	},
	{
		"num": 70,
		"faction": "cp",
		"commitment": "limited",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"rp_tu": 1,
		"name": "杰马勒粉碎秘密社团",
		"event": "DJEMEAL CRUSHES SECRET SOCIETIES"
	},
	{
		"num": 71,
		"faction": "cp",
		"commitment": "limited",
		"ops": 2,
		"sr": 2,
		"rp_tu": 1,
		"name": "康斯坦丁国王",
		"event": "KING CONSTANTINE"
	},
	{
		"num": 72,
		"faction": "cp",
		"commitment": "limited",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"rp_tu": 1,
		"name": "鲁贝尔堡的背叛",
		"event": "TREACHERY AT FORT RUPEL"
	},
	{
		"num": 73,
		"faction": "cp",
		"commitment": "limited",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"rp_tu": 1,
		"name": "土耳其增援",
		"event": "TURKISH REINFORCEMENTS"
	},
	{
		"num": 74,
		"faction": "cp",
		"commitment": "limited",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"cc": true,
		"rp_tu": 1,
		"name": "惊喜",
		"event": "SURPRISE CC"
	},
	{
		"num": 75,
		"faction": "cp",
		"commitment": "limited",
		"ops": 2,
		"sr": 2,
		"cc": true,
		"rp_tu": 1,
		"name": "贾法尔帕夏",
		"event": "JAFAR PASHA CC"
	},
	{
		"num": 76,
		"faction": "cp",
		"commitment": "limited",
		"ops": 2,
		"sr": 2,
		"cc": true,
		"rp_tu": 1,
		"name": "飞行分队",
		"event": "FLIEGERABTEILUNG CC"
	},
	{
		"num": 77,
		"faction": "cp",
		"commitment": "limited",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"ws": 1,
		"rp_ge": 1,
		"rp_tu": 2,
		"name": "地中海潜艇猎袭",
		"event": "GERMAN SUBS IN THE MED"
	},
	{
		"num": 78,
		"faction": "cp",
		"commitment": "limited",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"ws": 1,
		"rp_ge": 1,
		"rp_tu": 2,
		"name": "德国的波斯密谋",
		"event": "GERMAN INTRIGUES IN PERSIA"
	},
	{
		"num": 79,
		"faction": "cp",
		"commitment": "limited",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"rp_ge": 1,
		"rp_tu": 2,
		"name": "阿富汗使团",
		"event": "MISSION TO AFGHANISTAN"
	},
	{
		"num": 80,
		"faction": "cp",
		"commitment": "limited",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"rp_ge": 1,
		"rp_tu": 2,
		"name": "土耳其增援",
		"event": "TURKISH REINFORCEMENTS"
	},
	{
		"num": 81,
		"faction": "cp",
		"commitment": "limited",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"rp_ge": 1,
		"rp_tu": 2,
		"name": "土耳其增援",
		"event": "TURKISH REINFORCEMENTS"
	},
	{
		"num": 82,
		"faction": "cp",
		"commitment": "limited",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"cc": true,
		"rp_ge": 1,
		"rp_tu": 2,
		"name": "灾难性攻击",
		"event": "CATASROPHIC ATTACK CC"
	},
	{
		"num": 83,
		"faction": "cp",
		"commitment": "limited",
		"ops": 3,
		"sr": 4,
		"cc": true,
		"rp_ge": 1,
		"rp_tu": 2,
		"name": "战斗至死！",
		"event": "&quot;I ORDER YOU TO DIE&quot; CC"
	},
	{
		"num": 84,
		"faction": "cp",
		"commitment": "limited",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"ws": 1,
		"rp_ah": 1,
		"rp_ge": 2,
		"rp_tu": 3,
		"name": "恩维尔-法金汉首脑会议",
		"event": "ENVER-FALKENHAYN SUMMIT"
	},
	{
		"num": 85,
		"faction": "cp",
		"commitment": "limited",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"ws": 1,
		"rp_ah": 1,
		"rp_ge": 2,
		"rp_tu": 3,
		"name": "靶心指令",
		"event": "BULL'S EYE DIRECTIVE"
	},
	{
		"num": 86,
		"faction": "cp",
		"commitment": "limited",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"rp_ah": 1,
		"rp_ge": 2,
		"rp_tu": 3,
		"name": "戈尔利采-塔尔诺夫攻势",
		"event": "GORLICE-TARNOW"
	},
	{
		"num": 87,
		"faction": "cp",
		"commitment": "limited",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"rp_ah": 1,
		"rp_ge": 2,
		"rp_tu": 3,
		"name": "凡尔登战役",
		"event": "VERDUN"
	},
	{
		"num": 88,
		"faction": "cp",
		"commitment": "limited",
		"ops": 5,
		"sr": 5,
		"remove": true,
		"ws": 2,
		"rp_ah": 2,
		"rp_ge": 3,
		"name": "保加利亚",
		"event": "BULGARIA"
	},
	{
		"num": 89,
		"faction": "cp",
		"commitment": "limited",
		"ops": 5,
		"sr": 5,
		"remove": true,
		"ws": 2,
		"rp_ah": 2,
		"rp_ge": 3,
		"rp_tu": 4,
		"name": "帕尔乌斯游说柏林",
		"event": "PARVUS TO BERLIN"
	},
	{
		"num": 90,
		"faction": "cp",
		"commitment": "total",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"rp_tu": 1,
		"name": "汤森德谈判",
		"event": "TOWNSHEND TO LEMNOS"
	},
	{
		"num": 91,
		"faction": "cp",
		"commitment": "total",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"rp_tu": 1,
		"name": "“蜜蜂”党骚乱",
		"event": "APIS"
	},
	{
		"num": 92,
		"faction": "cp",
		"commitment": "total",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"rp_tu": 1,
		"name": "土耳其增援",
		"event": "TURKISH REINFORCEMENTS"
	},
	{
		"num": 93,
		"faction": "cp",
		"commitment": "total",
		"ops": 2,
		"sr": 2,
		"cc": true,
		"rp_tu": 1,
		"name": "淡水短缺",
		"event": "WATER SHORTAGE CC"
	},
	{
		"num": 94,
		"faction": "cp",
		"commitment": "total",
		"ops": 2,
		"sr": 2,
		"remove": true,
		"cc": true,
		"rp_tu": 1,
		"name": "帕夏一号",
		"event": "PASHA 1 CC"
	},
	{
		"num": 95,
		"faction": "cp",
		"commitment": "total",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"ws": 1,
		"rp_ge": 1,
		"rp_tu": 2,
		"name": "拯救保加利亚",
		"event": "&quot;TO HELP AND SAVE YOU&quot;"
	},
	{
		"num": 96,
		"faction": "cp",
		"commitment": "total",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"rp_ge": 1,
		"rp_tu": 2,
		"name": "塔拉特帕夏内阁改革",
		"event": "TALAAT PASHA REFORMS CABINET"
	},
	{
		"num": 97,
		"faction": "cp",
		"commitment": "total",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"cc": true,
		"rp_ge": 1,
		"rp_tu": 2,
		"name": "缴获沙皇军火",
		"event": "CZAR'S ARMORIES CC"
	},
	{
		"num": 98,
		"faction": "cp",
		"commitment": "total",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"cc": true,
		"rp_ge": 1,
		"rp_tu": 2,
		"name": "混乱指令",
		"event": "CONFUSED ORDERS CC"
	},
	{
		"num": 99,
		"faction": "cp",
		"commitment": "total",
		"ops": 3,
		"sr": 4,
		"remove": true,
		"cc": true,
		"rp_ah": 1,
		"rp_ge": 2,
		"rp_tu": 3,
		"name": "伊斯兰军",
		"event": "ARMY OF ISLAM CC"
	},
	{
		"num": 100,
		"faction": "cp",
		"commitment": "total",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"rp_ru": 1,
		"rp_ah": 2,
		"rp_ge": 3,
		"rp_in": null,
		"name": "YILDRIM",
		"event": "增援:3个德国耶尔德里姆步兵师，至任何可以连接至加利西亚的土耳其补给点。。如果法金汉HQ尚未被消灭，则还可以将其移动至存在耶尔德里姆师的地区。"
	},
	{
		"num": 101,
		"faction": "cp",
		"commitment": "total",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"ws": 1,
		"rp_ah": 1,
		"rp_ge": 2,
		"rp_tu": 3,
		"name": "圣战至上",
		"event": "JIHAD SUPREMACY"
	},
	{
		"num": 102,
		"faction": "cp",
		"commitment": "total",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"cc": true,
		"ws": 1,
		"rp_ah": 1,
		"rp_ge": 2,
		"rp_tu": 3,
		"name": "圣战攻势",
		"event": "JIHAD OFFENSIVE"
	},
	{
		"num": 103,
		"faction": "cp",
		"commitment": "total",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"ws": 1,
		"rp_ah": 1,
		"rp_ge": 2,
		"rp_tu": 3,
		"name": "罗伯逊",
		"event": "ROBERTSON"
	},
	{
		"num": 104,
		"faction": "cp",
		"commitment": "total",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"rp_ah": 1,
		"rp_ge": 2,
		"rp_tu": 3,
		"name": "柏林-巴格达铁路",
		"event": "BERLIN-BAGHDAD RAILROAD"
	},
	{
		"num": 105,
		"faction": "cp",
		"commitment": "total",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"rp_ah": 1,
		"rp_ge": 2,
		"rp_tu": 3,
		"name": "皇帝攻势",
		"event": "KAISERSCHLACHT"
	},
	{
		"num": 106,
		"faction": "cp",
		"commitment": "total",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"rp_ah": 1,
		"rp_ge": 2,
		"rp_tu": 3,
		"name": "土耳其增援",
		"event": "TURKISH REINFORCEMENTS"
	},
	{
		"num": 107,
		"faction": "cp",
		"commitment": "total",
		"ops": 4,
		"sr": 4,
		"remove": true,
		"rp_ru": 1,
		"rp_ah": 2,
		"rp_ge": 3,
		"rp_in": null,
		"name": "CAUCASIAN ARMY REFORMS",
		"event": "立即消灭4个地图上/预备军格的土耳其/土耳其-阿拉伯LCU作为代价。。增援:土耳其高加索第1军团、土耳其高加索第2军团 至安纳托利亚、高加索或者加里波利的同盟国控制区域。"
	},
	{
		"num": 108,
		"faction": "cp",
		"commitment": "total",
		"ops": 5,
		"sr": 5,
		"remove": true,
		"ws": 2,
		"rp_ah": 2,
		"rp_ge": 3,
		"rp_tu": 4,
		"name": "无限制潜艇战",
		"event": "UNRESTRICTED SUBMARINE WARFARE"
	},
	{
		"num": 109,
		"faction": "cp",
		"commitment": "total",
		"ops": 5,
		"sr": 5,
		"remove": true,
		"ws": 2,
		"rp_ah": 2,
		"rp_ge": 3,
		"rp_tu": 4,
		"name": "耶尔德里姆攻势",
		"event": "YILDRIM OFFENSIVE"
	},
	{
		"num": 110,
		"faction": "cp",
		"commitment": "total",
		"ops": 5,
		"sr": 5,
		"remove": true,
		"rp_ah": 2,
		"rp_ge": 3,
		"rp_tu": 4,
		"name": "英国厌战",
		"event": "BRITISH WAR WEARINESS"
	}
],
	ui: [
	{
		"id": 1,
		"key": "AP MO RU",
		"x": 3165,
		"y": 2393,
		"w": 75,
		"h": 75
	},
	{
		"id": 2,
		"key": "AP MO No Attack",
		"x": 3242,
		"y": 2392,
		"w": 75,
		"h": 75
	},
	{
		"id": 3,
		"key": "AP MO BR/IN/ANZ",
		"x": 3318,
		"y": 2392,
		"w": 75,
		"h": 75
	},
	{
		"id": 4,
		"key": "AP MO Meso/Persia",
		"x": 3395,
		"y": 2392,
		"w": 75,
		"h": 75
	},
	{
		"id": 5,
		"key": "AP MO None",
		"x": 3473,
		"y": 2392,
		"w": 75,
		"h": 75
	},
	{
		"id": 6,
		"key": "AP MO Balkans",
		"x": 3550,
		"y": 2393,
		"w": 75,
		"h": 75
	},
	{
		"id": 7,
		"key": "AP MO Egypt",
		"x": 3626,
		"y": 2392,
		"w": 75,
		"h": 75
	},
	{
		"id": 8,
		"key": "AP MO Made",
		"x": 3702,
		"y": 2392,
		"w": 75,
		"h": 75
	},
	{
		"id": 9,
		"key": "APMO+0",
		"x": 3390,
		"y": 2267,
		"w": 75,
		"h": 75
	},
	{
		"id": 10,
		"key": "APMO+1",
		"x": 3461,
		"y": 2267,
		"w": 75,
		"h": 75
	},
	{
		"id": 11,
		"key": "APMO+2",
		"x": 3532,
		"y": 2267,
		"w": 75,
		"h": 75
	},
	{
		"id": 12,
		"key": "APMO+3",
		"x": 3603,
		"y": 2267,
		"w": 75,
		"h": 75
	},
	{
		"id": 13,
		"key": "APMO+4",
		"x": 3676,
		"y": 2267,
		"w": 75,
		"h": 75
	},
	{
		"id": 14,
		"key": "CP MO RU",
		"x": 1391,
		"y": 147,
		"w": 75,
		"h": 75
	},
	{
		"id": 15,
		"key": "CP MO BR/IN/ANZ",
		"x": 1464,
		"y": 147,
		"w": 75,
		"h": 75
	},
	{
		"id": 16,
		"key": "CP MO TU",
		"x": 1537,
		"y": 147,
		"w": 75,
		"h": 75
	},
	{
		"id": 17,
		"key": "CP MO Enver",
		"x": 1610,
		"y": 147,
		"w": 75,
		"h": 75
	},
	{
		"id": 18,
		"key": "CP MO None",
		"x": 1681,
		"y": 147,
		"w": 75,
		"h": 75
	},
	{
		"id": 19,
		"key": "GR 0",
		"x": 70,
		"y": 2405,
		"w": 75,
		"h": 75
	},
	{
		"id": 20,
		"key": "GR 1",
		"x": 157,
		"y": 2405,
		"w": 75,
		"h": 75
	},
	{
		"id": 21,
		"key": "GR 2",
		"x": 243,
		"y": 2405,
		"w": 75,
		"h": 75
	},
	{
		"id": 22,
		"key": "GR 3",
		"x": 330,
		"y": 2405,
		"w": 75,
		"h": 75
	},
	{
		"id": 23,
		"key": "GR 4",
		"x": 417,
		"y": 2405,
		"w": 75,
		"h": 75
	},
	{
		"id": 24,
		"key": "GR 5",
		"x": 503,
		"y": 2405,
		"w": 75,
		"h": 75
	},
	{
		"id": 25,
		"key": "GR 6",
		"x": 590,
		"y": 2405,
		"w": 75,
		"h": 75
	},
	{
		"id": 26,
		"key": "GR 7",
		"x": 677,
		"y": 2405,
		"w": 75,
		"h": 75
	},
	{
		"id": 27,
		"key": "GR 8",
		"x": 70,
		"y": 2505,
		"w": 75,
		"h": 75
	},
	{
		"id": 28,
		"key": "GR 9",
		"x": 157,
		"y": 2505,
		"w": 75,
		"h": 75
	},
	{
		"id": 29,
		"key": "GR 10",
		"x": 244,
		"y": 2505,
		"w": 75,
		"h": 75
	},
	{
		"id": 30,
		"key": "GR 11",
		"x": 330,
		"y": 2505,
		"w": 75,
		"h": 75
	},
	{
		"id": 31,
		"key": "GR 12",
		"x": 417,
		"y": 2505,
		"w": 75,
		"h": 75
	},
	{
		"id": 32,
		"key": "GR 13",
		"x": 503,
		"y": 2505,
		"w": 75,
		"h": 75
	},
	{
		"id": 33,
		"key": "GR 14",
		"x": 590,
		"y": 2505,
		"w": 75,
		"h": 75
	},
	{
		"id": 34,
		"key": "GR 15",
		"x": 677,
		"y": 2505,
		"w": 75,
		"h": 75
	},
	{
		"id": 35,
		"key": "GR 16",
		"x": 764,
		"y": 2505,
		"w": 75,
		"h": 75
	},
	{
		"id": 36,
		"key": "GR 17",
		"x": 70,
		"y": 2603,
		"w": 75,
		"h": 75
	},
	{
		"id": 37,
		"key": "GR 18",
		"x": 157,
		"y": 2603,
		"w": 75,
		"h": 75
	},
	{
		"id": 38,
		"key": "GR 19",
		"x": 243,
		"y": 2603,
		"w": 75,
		"h": 75
	},
	{
		"id": 39,
		"key": "GR 20",
		"x": 330,
		"y": 2603,
		"w": 75,
		"h": 75
	},
	{
		"id": 40,
		"key": "GR 21",
		"x": 417,
		"y": 2603,
		"w": 75,
		"h": 75
	},
	{
		"id": 41,
		"key": "GR 22",
		"x": 503,
		"y": 2603,
		"w": 75,
		"h": 75
	},
	{
		"id": 42,
		"key": "GR 23",
		"x": 590,
		"y": 2603,
		"w": 75,
		"h": 75
	},
	{
		"id": 43,
		"key": "GR 24",
		"x": 676,
		"y": 2603,
		"w": 75,
		"h": 75
	},
	{
		"id": 44,
		"key": "GR 25",
		"x": 763,
		"y": 2603,
		"w": 75,
		"h": 75
	},
	{
		"id": 45,
		"key": "GR 26",
		"x": 849,
		"y": 2603,
		"w": 75,
		"h": 75
	},
	{
		"id": 46,
		"key": "GR 27",
		"x": 70,
		"y": 2706,
		"w": 75,
		"h": 75
	},
	{
		"id": 47,
		"key": "GR 28",
		"x": 157,
		"y": 2705,
		"w": 75,
		"h": 75
	},
	{
		"id": 48,
		"key": "GR 29",
		"x": 243,
		"y": 2705,
		"w": 75,
		"h": 75
	},
	{
		"id": 49,
		"key": "GR 30",
		"x": 330,
		"y": 2705,
		"w": 75,
		"h": 75
	},
	{
		"id": 50,
		"key": "GR 31",
		"x": 417,
		"y": 2705,
		"w": 75,
		"h": 75
	},
	{
		"id": 51,
		"key": "GR 32",
		"x": 503,
		"y": 2705,
		"w": 75,
		"h": 75
	},
	{
		"id": 52,
		"key": "GR 33",
		"x": 590,
		"y": 2705,
		"w": 75,
		"h": 75
	},
	{
		"id": 53,
		"key": "GR 34",
		"x": 677,
		"y": 2705,
		"w": 75,
		"h": 75
	},
	{
		"id": 54,
		"key": "GR 35",
		"x": 764,
		"y": 2705,
		"w": 75,
		"h": 75
	},
	{
		"id": 55,
		"key": "GR 36",
		"x": 850,
		"y": 2705,
		"w": 75,
		"h": 75
	},
	{
		"id": 56,
		"key": "GR 37",
		"x": 937,
		"y": 2705,
		"w": 75,
		"h": 75
	},
	{
		"id": 57,
		"key": "GR 38",
		"x": 1023,
		"y": 2705,
		"w": 75,
		"h": 75
	},
	{
		"id": 58,
		"key": "GR 39",
		"x": 1110,
		"y": 2705,
		"w": 75,
		"h": 75
	},
	{
		"id": 59,
		"key": "GR 40",
		"x": 1197,
		"y": 2705,
		"w": 75,
		"h": 75
	},
	{
		"id": 60,
		"key": "RU Rev",
		"x": 2800,
		"y": 73,
		"w": 75,
		"h": 75
	},
	{
		"id": 61,
		"key": "RU Rev1",
		"x": 2871,
		"y": 73,
		"w": 75,
		"h": 75
	},
	{
		"id": 62,
		"key": "RU Rev2",
		"x": 2942,
		"y": 73,
		"w": 75,
		"h": 75
	},
	{
		"id": 63,
		"key": "RU Rev3",
		"x": 3014,
		"y": 73,
		"w": 75,
		"h": 75
	},
	{
		"id": 64,
		"key": "RU Rev4",
		"x": 3085,
		"y": 73,
		"w": 75,
		"h": 75
	},
	{
		"id": 65,
		"key": "Turn 1",
		"x": 3837,
		"y": 2345,
		"w": 75,
		"h": 75
	},
	{
		"id": 66,
		"key": "Turn 2",
		"x": 3837,
		"y": 2435,
		"w": 75,
		"h": 75
	},
	{
		"id": 67,
		"key": "Turn 3",
		"x": 3973,
		"y": 2435,
		"w": 75,
		"h": 75
	},
	{
		"id": 68,
		"key": "Turn 4",
		"x": 4111,
		"y": 2435,
		"w": 75,
		"h": 75
	},
	{
		"id": 69,
		"key": "Turn 5",
		"x": 4248,
		"y": 2435,
		"w": 75,
		"h": 75
	},
	{
		"id": 70,
		"key": "Turn 6",
		"x": 3837,
		"y": 2527,
		"w": 75,
		"h": 75
	},
	{
		"id": 71,
		"key": "Turn 7",
		"x": 3973,
		"y": 2527,
		"w": 75,
		"h": 75
	},
	{
		"id": 72,
		"key": "Turn 8",
		"x": 4111,
		"y": 2527,
		"w": 75,
		"h": 75
	},
	{
		"id": 73,
		"key": "Turn 9",
		"x": 4248,
		"y": 2527,
		"w": 75,
		"h": 75
	},
	{
		"id": 74,
		"key": "Turn 10",
		"x": 3837,
		"y": 2619,
		"w": 75,
		"h": 75
	},
	{
		"id": 75,
		"key": "Turn 11",
		"x": 3973,
		"y": 2619,
		"w": 75,
		"h": 75
	},
	{
		"id": 76,
		"key": "Turn 12",
		"x": 4111,
		"y": 2619,
		"w": 75,
		"h": 75
	},
	{
		"id": 77,
		"key": "Turn 13",
		"x": 4248,
		"y": 2619,
		"w": 75,
		"h": 75
	},
	{
		"id": 78,
		"key": "Turn 14",
		"x": 3837,
		"y": 2710,
		"w": 75,
		"h": 75
	},
	{
		"id": 79,
		"key": "Turn 15",
		"x": 3973,
		"y": 2710,
		"w": 75,
		"h": 75
	},
	{
		"id": 80,
		"key": "Turn 16",
		"x": 4111,
		"y": 2710,
		"w": 75,
		"h": 75
	},
	{
		"id": 81,
		"key": "Turn 17",
		"x": 4248,
		"y": 2710,
		"w": 75,
		"h": 75
	},
	{
		"id": 82,
		"key": "neutral_gr_UI",
		"x": 150,
		"y": 958,
		"w": 200,
		"h": 160
	},
	{
		"id": 83,
		"key": "neutral_bu_UI",
		"x": 530,
		"y": 414,
		"w": 200,
		"h": 160
	},
	{
		"id": 84,
		"key": "neutral_ro_UI",
		"x": 694,
		"y": 127,
		"w": 200,
		"h": 160
	},
	{
		"id": 85,
		"key": "LCU_limit_AP1",
		"x": 2681,
		"y": 1916,
		"w": 75,
		"h": 75
	},
	{
		"id": 86,
		"key": "LCU_limit_AP2",
		"x": 2753,
		"y": 1916,
		"w": 75,
		"h": 75
	},
	{
		"id": 87,
		"key": "LCU_limit_AP3",
		"x": 2824,
		"y": 1916,
		"w": 75,
		"h": 75
	},
	{
		"id": 88,
		"key": "LCU_limit_CP1",
		"x": 2681,
		"y": 2024,
		"w": 75,
		"h": 75
	},
	{
		"id": 89,
		"key": "LCU_limit_CP2",
		"x": 2752,
		"y": 2024,
		"w": 75,
		"h": 75
	},
	{
		"id": 90,
		"key": "LCU_limit_CP3",
		"x": 2826,
		"y": 2024,
		"w": 75,
		"h": 75
	},
	{
		"id": 91,
		"key": "C.Asia_Revolt",
		"x": 4103,
		"y": 296,
		"w": 75,
		"h": 75
	},
	{
		"id": 92,
		"key": "Afghan_Alliance",
		"x": 4093,
		"y": 689,
		"w": 75,
		"h": 75
	},
	{
		"id": 93,
		"key": "Indian_Mutiny",
		"x": 4245,
		"y": 983,
		"w": 75,
		"h": 75
	},
	{
		"id": 94,
		"key": "Persian_Neutrality",
		"x": 3876,
		"y": 762,
		"w": 75,
		"h": 75
	},
	{
		"id": 95,
		"key": "CP Air Superiority",
		"x": 1219,
		"y": 1654,
		"w": 75,
		"h": 75
	},
	{
		"id": 96,
		"key": "GE RPs TO TU",
		"x": 1328,
		"y": 1654,
		"w": 75,
		"h": 75
	},
	{
		"id": 97,
		"key": "BR RPs TO RU",
		"x": 799,
		"y": 2139,
		"w": 75,
		"h": 75
	},
	{
		"id": 98,
		"key": "AP Air Superiority",
		"x": 910,
		"y": 2139,
		"w": 75,
		"h": 75
	},
	{
		"id": 99,
		"key": "RU Amphib Assault Allowed",
		"x": 1019,
		"y": 2139,
		"w": 75,
		"h": 75
	},
	{
		"id": 100,
		"key": "Cyprus Allowed",
		"x": 1570,
		"y": 1566,
		"w": 75,
		"h": 75
	},
	{
		"id": 101,
		"key": "Egypt Uprising",
		"x": 1497,
		"y": 2128,
		"w": 75,
		"h": 75
	},
	{
		"id": 102,
		"key": "Sinai Railroad",
		"x": 1792,
		"y": 2131,
		"w": 75,
		"h": 75
	},
	{
		"id": 103,
		"key": "neutral_SB_UI",
		"x": 80,
		"y": 325,
		"w": 200,
		"h": 160
	},
	{
		"id": 104,
		"key": "SUB IN THE MED",
		"x": 700,
		"y": 1256,
		"w": 75,
		"h": 75
	},
	{
		"id": 105,
		"key": "BB.RR",
		"x": 1958,
		"y": 1083,
		"w": 75,
		"h": 75
	},
	{
		"id": 1000,
		"key": "box_cp_corps_assets_tu_lcu",
		"x": 808,
		"y": 1760,
		"w": 44,
		"h": 44
	},
	{
		"id": 1001,
		"key": "box_cp_corps_assets_tua_lcu",
		"x": 927,
		"y": 1760,
		"w": 44,
		"h": 44
	},
	{
		"id": 1100,
		"key": "box_cp_reserve_tu_scu",
		"x": 1055,
		"y": 1680,
		"w": 44,
		"h": 44
	},
	{
		"id": 1101,
		"key": "box_cp_reserve_tua_scu",
		"x": 1145,
		"y": 1680,
		"w": 44,
		"h": 44
	},
	{
		"id": 1102,
		"key": "box_cp_reserve_bu_scu",
		"x": 1055,
		"y": 1800,
		"w": 44,
		"h": 44
	},
	{
		"id": 1103,
		"key": "box_cp_reserve_ge_scu",
		"x": 1145,
		"y": 1800,
		"w": 44,
		"h": 44
	},
	{
		"id": 1104,
		"key": "box_cp_reserve_ah_scu",
		"x": 1240,
		"y": 1800,
		"w": 44,
		"h": 44
	},
	{
		"id": 1105,
		"key": "box_cp_reserve_minor_scu",
		"x": 1340,
		"y": 1800,
		"w": 44,
		"h": 44
	},
	{
		"id": 1200,
		"key": "box_cp_eliminated_tu_lcu",
		"x": 2155,
		"y": 85,
		"w": 44,
		"h": 44
	},
	{
		"id": 1201,
		"key": "box_cp_eliminated_tu_scu",
		"x": 2155,
		"y": 170,
		"w": 44,
		"h": 44
	},
	{
		"id": 1202,
		"key": "box_cp_eliminated_tua_lcu",
		"x": 2238,
		"y": 85,
		"w": 44,
		"h": 44
	},
	{
		"id": 1203,
		"key": "box_cp_eliminated_tua_scu",
		"x": 2238,
		"y": 170,
		"w": 44,
		"h": 44
	},
	{
		"id": 1204,
		"key": "box_cp_eliminated_bu_lcu",
		"x": 2320,
		"y": 85,
		"w": 44,
		"h": 44
	},
	{
		"id": 1205,
		"key": "box_cp_eliminated_bu_scu",
		"x": 2320,
		"y": 170,
		"w": 44,
		"h": 44
	},
	{
		"id": 1206,
		"key": "box_cp_eliminated_ge_lcu",
		"x": 2155,
		"y": 260,
		"w": 44,
		"h": 44
	},
	{
		"id": 1207,
		"key": "box_cp_eliminated_ge_scu",
		"x": 2155,
		"y": 340,
		"w": 44,
		"h": 44
	},
	{
		"id": 1208,
		"key": "box_cp_eliminated_ah_lcu",
		"x": 2240,
		"y": 260,
		"w": 44,
		"h": 44
	},
	{
		"id": 1209,
		"key": "box_cp_eliminated_ah_scu",
		"x": 2238,
		"y": 340,
		"w": 44,
		"h": 44
	},
	{
		"id": 1210,
		"key": "box_cp_eliminated_minor",
		"x": 2320,
		"y": 340,
		"w": 44,
		"h": 44
	},
	{
		"id": 1211,
		"key": "box_cp_eliminated_tr",
		"x": 2320,
		"y": 260,
		"w": 44,
		"h": 44
	},
	{
		"id": 2000,
		"key": "box_ap_corps_assets_ru_lcu",
		"x": 1230,
		"y": 1995,
		"w": 44,
		"h": 44
	},
	{
		"id": 2001,
		"key": "box_ap_corps_assets_br_lcu",
		"x": 1230,
		"y": 2080,
		"w": 44,
		"h": 44
	},
	{
		"id": 2002,
		"key": "box_ap_corps_assets_in_lcu",
		"x": 1340,
		"y": 1995,
		"w": 44,
		"h": 44
	},
	{
		"id": 2003,
		"key": "box_ap_corps_assets_fr_lcu",
		"x": 1340,
		"y": 2080,
		"w": 44,
		"h": 44
	},
	{
		"id": 2004,
		"key": "box_ap_corps_assets_anz_lcu",
		"x": 1230,
		"y": 2160,
		"w": 44,
		"h": 44
	},
	{
		"id": 2100,
		"key": "box_ap_reserve_ru_scu",
		"x": 815,
		"y": 1995,
		"w": 44,
		"h": 44
	},
	{
		"id": 2101,
		"key": "box_ap_reserve_br_scu",
		"x": 815,
		"y": 2065,
		"w": 44,
		"h": 44
	},
	{
		"id": 2102,
		"key": "box_ap_reserve_in_scu",
		"x": 910,
		"y": 1995,
		"w": 44,
		"h": 44
	},
	{
		"id": 2103,
		"key": "box_ap_reserve_anz_scu",
		"x": 910,
		"y": 2065,
		"w": 44,
		"h": 44
	},
	{
		"id": 2104,
		"key": "box_ap_reserve_sb_scu",
		"x": 1005,
		"y": 1995,
		"w": 44,
		"h": 44
	},
	{
		"id": 2105,
		"key": "box_ap_reserve_ro_scu",
		"x": 1005,
		"y": 2065,
		"w": 44,
		"h": 44
	},
	{
		"id": 2106,
		"key": "box_ap_reserve_fr_scu",
		"x": 1095,
		"y": 1995,
		"w": 44,
		"h": 44
	},
	{
		"id": 2107,
		"key": "box_ap_reserve_other_scu",
		"x": 1095,
		"y": 2065,
		"w": 44,
		"h": 44
	},
	{
		"id": 2108,
		"key": "box_ap_reserve_beachhead",
		"x": 1115,
		"y": 2160,
		"w": 44,
		"h": 44
	},
	{
		"id": 2200,
		"key": "box_ap_eliminated_ru_lcu",
		"x": 1548,
		"y": 2615,
		"w": 44,
		"h": 44
	},
	{
		"id": 2201,
		"key": "box_ap_eliminated_ru_scu",
		"x": 1548,
		"y": 2678,
		"w": 44,
		"h": 44
	},
	{
		"id": 2202,
		"key": "box_ap_eliminated_br_lcu",
		"x": 1624,
		"y": 2615,
		"w": 44,
		"h": 44
	},
	{
		"id": 2203,
		"key": "box_ap_eliminated_br_scu",
		"x": 1624,
		"y": 2678,
		"w": 44,
		"h": 44
	},
	{
		"id": 2204,
		"key": "box_ap_eliminated_anz_lcu",
		"x": 1699,
		"y": 2615,
		"w": 44,
		"h": 44
	},
	{
		"id": 2205,
		"key": "box_ap_eliminated_anz_scu",
		"x": 1699,
		"y": 2678,
		"w": 44,
		"h": 44
	},
	{
		"id": 2206,
		"key": "box_ap_eliminated_in_lcu",
		"x": 1780,
		"y": 2615,
		"w": 44,
		"h": 44
	},
	{
		"id": 2207,
		"key": "box_ap_eliminated_in_scu",
		"x": 1780,
		"y": 2678,
		"w": 44,
		"h": 44
	},
	{
		"id": 2208,
		"key": "box_ap_eliminated_sb_lcu",
		"x": 1855,
		"y": 2615,
		"w": 44,
		"h": 44
	},
	{
		"id": 2209,
		"key": "box_ap_eliminated_sb_scu",
		"x": 1855,
		"y": 2678,
		"w": 44,
		"h": 44
	},
	{
		"id": 2210,
		"key": "box_ap_eliminated_fr_lcu",
		"x": 1548,
		"y": 2740,
		"w": 44,
		"h": 44
	},
	{
		"id": 2211,
		"key": "box_ap_eliminated_fr_scu",
		"x": 1624,
		"y": 2740,
		"w": 44,
		"h": 44
	},
	{
		"id": 2212,
		"key": "box_ap_eliminated_ro_lcu",
		"x": 1699,
		"y": 2740,
		"w": 44,
		"h": 44
	},
	{
		"id": 2213,
		"key": "box_ap_eliminated_ro_scu",
		"x": 1780,
		"y": 2740,
		"w": 44,
		"h": 44
	},
	{
		"id": 2214,
		"key": "box_ap_eliminated_other",
		"x": 1855,
		"y": 2740,
		"w": 44,
		"h": 44
	},
	{
		"id": 2215,
		"key": "INDIA_control",
		"x": 4250,
		"y": 1170,
		"w": 75,
		"h": 75
	},
	{
		"id": 2216,
		"key": "CENTRAL_ASIA_control",
		"x": 4248,
		"y": 432,
		"w": 75,
		"h": 75
	}
]
}

// Helper structures if needed
data.space_name = {
	"Kronstadt": 1,
	"Braila": 2,
	"Bolgrad": 3,
	"Hermannstadt": 4,
	"Ploesti": 5,
	"Hatseg": 6,
	"Cernavoda": 7,
	"Campolung": 8,
	"Derbent": 9,
	"Suram": 10,
	"Poti": 11,
	"TIFLIS": 12,
	"BUCHAREST": 13,
	"Targu Jiu": 14,
	"Turtukai": 15,
	"Constanta": 16,
	"BELGRADE": 17,
	"Craiova": 18,
	"Batum": 19,
	"Akstafa": 20,
	"Akhalkaln": 21,
	"Aleksandropol": 22,
	"Baku": 23,
	"Rustchuk": 24,
	"Vidin": 25,
	"Evlakh": 26,
	"Varna": 27,
	"Shemakha": 28,
	"Nis": 29,
	"Ardahan": 30,
	"Plevna": 31,
	"Erevan": 32,
	"Kars": 33,
	"Tirnova": 34,
	"Inebolu": 35,
	"SOFIA": 36,
	"Nachivan": 37,
	"Rize": 38,
	"Zagora": 39,
	"Salyani": 40,
	"Skopje": 41,
	"Burgas": 42,
	"Kagizman": 43,
	"Trabzon": 44,
	"Ordubad": 45,
	"Oltu": 46,
	"Sarikamis": 47,
	"Giresun": 48,
	"Philippopoli": 49,
	"Veles": 50,
	"Bayazit": 51,
	"Bayburt": 52,
	"Hazva": 53,
	"Strumica": 54,
	"Julfa": 55,
	"Adrianople": 56,
	"Eregli (Black Sea)": 57,
	"Koprukoy": 58,
	"Astara": 59,
	"Kastamonu": 60,
	"Gumushane": 61,
	"Eleskirt": 62,
	"Catalca": 63,
	"Ardebil": 64,
	"CONSTANTINOPLE": 65,
	"Ercis": 66,
	"Erzurum": 67,
	"Amasya": 68,
	"Ft. Rupel": 69,
	"Monastir": 70,
	"Erzincan": 71,
	"Khoy": 72,
	"Doiran": 73,
	"Sebin Kara-Hissar": 74,
	"Xanthi": 75,
	"Karabuk": 76,
	"Malazgirt": 77,
	"Enzeli": 78,
	"Rodosto": 79,
	"Tabriz": 80,
	"Cankiri": 81,
	"Adapazari": 82,
	"Mianeh": 83,
	"Mus": 84,
	"Yozgat": 85,
	"Sivas": 86,
	"Van": 87,
	"The Struma": 88,
	"Bandirma": 89,
	"Devrigi": 91,
	"Florina": 92,
	"Prespa": 93,
	"Bursa": 94,
	"Salonika": 95,
	"Urmia": 96,
	"Kirikkale": 97,
	"Bitlis": 98,
	"Maragha": 99,
	"Harput": 100,
	"Menjil": 101,
	"Baskale": 102,
	"Ankara": 103,
	"Sevrehissar": 104,
	"Eskishehir": 105,
	"Kayseri": 106,
	"Nevsehir": 107,
	"Arapkir": 108,
	"Malatya": 109,
	"Zenjan": 110,
	"Balikesir": 111,
	"Edremit": 112,
	"Thermaikos Bay": 113,
	"Trikkala": 114,
	"Kazvin": 115,
	"Cizre": 116,
	"Larissa": 117,
	"Suj Bulak": 118,
	"Saqqiz": 119,
	"Diyarbekir": 120,
	"Kirsehir": 121,
	"TEHERAN": 122,
	"Nigde": 123,
	"Afyon": 124,
	"Ruwandiz": 125,
	"to Smyrna": 126,
	"Usak": 127,
	"Manisa": 128,
	"Mardin": 129,
	"Sultan Bulak": 130,
	"Lamia": 131,
	"Sehneh": 132,
	"Qum": 133,
	"Mosul": 134,
	"Smyrna": 135,
	"to Athens": 136,
	"Ras-ul-Ain": 137,
	"Hamadan": 138,
	"Eregli": 139,
	"Mamure Station": 140,
	"Nazibin": 141,
	"Konya": 142,
	"Aydin": 143,
	"Isparta": 144,
	"Denizli": 145,
	"Kirkuk": 146,
	"Sultanabad": 147,
	"Suleymaniye": 148,
	"ATHENS": 149,
	"Adana": 150,
	"Kashan": 151,
	"Kermanshah": 152,
	"Burujird": 153,
	"Tikrit": 154,
	"Aleppo": 155,
	"Al Hasakah": 156,
	"Mersin": 157,
	"Akseki": 158,
	"Alexandretta": 159,
	"Rakka": 160,
	"Deir es Zor": 161,
	"Antalya": 162,
	"Karind": 163,
	"Mugla": 164,
	"To Adana": 166,
	"Samarra": 167,
	"Khanikan": 168,
	"Bulair": 169,
	"Antioch": 170,
	"Hama": 171,
	"Isfahan": 172,
	"Dizful": 173,
	"Shiraz": 174,
	"Mayadin": 175,
	"Taifur Keui": 177,
	"Gallipoli": 178,
	"Hit": 179,
	"Karnabikeui": 180,
	"El Ghaim": 181,
	"Homs": 182,
	"Cyprus": 183,
	"Baghdad": 184,
	"Ctesiphon": 185,
	"Shuster": 186,
	"Bair Keui": 187,
	"Anafarta": 188,
	"Ramadi": 189,
	"Sannaiyat": 190,
	"Chardak": 191,
	"To Beirut": 192,
	"Riyaq": 193,
	"Aziziya": 194,
	"Museyib": 195,
	"Beirut": 196,
	"Suvla Bay": 197,
	"Kut": 198,
	"Yalova": 199,
	"Bushire": 201,
	"Damascus": 202,
	"Amara": 203,
	"Sari Bahr": 204,
	"Karbala": 205,
	"Hilla": 206,
	"Ahwaz": 207,
	"Megiddo": 208,
	"To Haifa": 209,
	"Gaba Tepe": 210,
	"Bergaz": 211,
	"Haifa": 213,
	"The Hai": 214,
	"Najaf": 215,
	"Qurna": 216,
	"Dera": 217,
	"Maidos": 218,
	"Umtaiye": 219,
	"Canakkale": 220,
	"Cape Helles": 221,
	"Diwaniyeh": 222,
	"To Jaffa": 223,
	"Nablus": 224,
	"Abadan": 225,
	"Basra": 226,
	"Krithia": 227,
	"Jaffa": 228,
	"Nasiriya": 229,
	"Samawa": 230,
	"Kizilkechili": 232,
	"Ercenkeui": 233,
	"Fao": 234,
	"Azraq": 235,
	"Amman": 236,
	"Jerusalem": 237,
	"to Abadan": 238,
	"Seddul Bahr": 239,
	"Shaiba": 240,
	"Gaza": 241,
	"Kizil Kaya": 242,
	"Nalif-eli": 243,
	"Hesa": 244,
	"Bair": 245,
	"Kuwait": 246,
	"Besika Bay": 247,
	"Kum Kale": 248,
	"Beersheba": 249,
	"Ezine": 250,
	"El Arish": 251,
	"to Kuwait": 252,
	"Romani": 254,
	"Port Said": 255,
	"Alexandria": 256,
	"Zagazig": 257,
	"Sollum": 259,
	"Sidi Barrani": 260,
	"Kossaima": 261,
	"Ismailia": 262,
	"Maan": 263,
	"Mersa Matruh": 264,
	"Jifjaffa": 265,
	"Gara": 266,
	"Faiyum": 267,
	"CAIRO": 268,
	"Suez": 269,
	"Nekhi": 270,
	"Aqaba": 271,
	"Tabuk": 272,
	"Bahariya Oasis": 273,
	"Siwa Oasis": 275,
	"Yenbo": 276,
	"Medina": 277,
	"Mecca": 278,
	"Jiddah": 280,
	"AP Eliminated": 281,
	"AP Reserve": 282,
	"Central Asia": 283,
	"CP Corps Assets": 284,
	"CP Eliminated": 285,
	"CP Reserve": 286,
	"The Bosphorus Forts": 287,
	"Lemnos": 288,
	"Samsun": 289,
	"to Fao": 290,
	"Bahrain": 291,
	"Meshed": 292,
	"AP Corps Assets": 293,
	"Odessa": 295,
	"Galicia": 296,
	"Petrovsk": 297,
	"Afghanistan": 298,
	"Baluchistan": 299,
	"Khartoum": 300,
	"Bakhtiari": 301,
	"Kurds": 302,
	"Senussi": 303,
	"Bawi": 304,
	"Laz": 305,
	"Qashqai": 306,
	"Tangistani": 307,
	"Marsh": 308,
	"NW Frontier": 309,
	"Jangali": 310,
	"Sinjabi": 311,
	"INDIA": 313,
	"ANZ Elite DIV": 1001,
	"ANZ Cavalry #1": 1002,
	"BR Persian Cordon #1": 1003,
	"RU Elite DIV #3": 1004,
	"RU DIV #11 #12": 1005,
	"RU DIV #11": 1005,
	"RU DIV #12": 1005,
	"RU IV Caucasian": 1006,
	"RU Elite DIV #4": 1007,
	"RU DIV #13": 1008,
	"RU Cavalry #7": 1009,
	"Max TU RP": 1010,
	"Beachhead #2": 1011,
	"BR Elite DIV #1 #2": 1012,
	"BR Elite DIV #1": 1012,
	"BR Elite DIV #2": 1012,
	"Kitch.token": 1013,
	"Arab Revolt #1 #2": 1014,
	"Arab Revolt #1": 1014,
	"Arab Revolt #2": 1014,
	"Arab faisal Revolt": 1015,
	"RU 2/4 Special": 1016,
	"IT DIV": 1017,
	"GR National Defense": 1018,
	"ANZ Imp Camel": 1019,
	"ANZ Cavalry #2": 1020,
	"SINAI RAILROAD": 1021,
	"BR IX Corps": 1022,
	"BR Elite DIV #3": 1023,
	"BR DIV #2 #3": 1024,
	"BR DIV #2": 1024,
	"BR DIV #3": 1024,
	"BR Cavalry #1": 1025,
	"Beachhead #3": 1026,
	"RU DIV #14": 1027,
	"RU Cavalry #8": 1028,
	"RU Baratov HQ": 1029,
	"RU/PE Police North": 1030,
	"BR Persian Cordon #2 #3 #4": 1031,
	"BR Persian Cordon #2": 1031,
	"BR Persian Cordon #3": 1031,
	"BR Persian Cordon #4": 1031,
	"SB 1 Army": 1032,
	"SB 2 Army": 1033,
	"SB 3 Army": 1034,
	"SB DIV #1 #2 #3 #4 #5 #6": 1035,
	"SB DIV #1": 1035,
	"SB DIV #2": 1035,
	"SB DIV #3": 1035,
	"SB DIV #4": 1035,
	"SB DIV #5": 1035,
	"SB DIV #6": 1035,
	"SB Cavalry": 1036,
	"RU V Caucasian": 1037,
	"RU Black Sea": 1038,
	"RU Elite DIV #5": 1039,
	"IN Tigris Corps": 1040,
	"IN 2nd Corps": 1041,
	"IN DIV #7": 1042,
	"BR Elite DIV #4 #5 #6": 1043,
	"BR Elite DIV #4": 1043,
	"BR Elite DIV #5": 1043,
	"BR Elite DIV #6": 1043,
	"BR Maude HQ": 1044,
	"IN 15th DIV": 1045,
	"BR VIII Corps": 1046,
	"ANZ ANZAC": 1047,
	"BR DIV #4": 1048,
	"FR DIV #1 #2": 1049,
	"FR DIV #1": 1049,
	"FR DIV #2": 1049,
	"Beachhead #4 #5": 1050,
	"Beachhead #4": 1050,
	"Beachhead #5": 1050,
	"Armenian Uprising": 1051,
	"Armenian Uprising token #1 #2 #3": 1052,
	"Armenian Uprising token #1": 1052,
	"Armenian Uprising token #2": 1052,
	"Armenian Uprising token #3": 1052,
	"BR Cavalry #2": 1053,
	"BR XII Corps": 1054,
	"BR XVI Corps": 1055,
	"FR Army Orient 1": 1056,
	"FR DIV #3 #4": 1057,
	"FR DIV #3": 1057,
	"FR DIV #4": 1057,
	"Beachhead #6": 1058,
	"BR Dunsterforce": 1059,
	"BR/PE SPers Rifles": 1060,
	"IN 17th DIV": 1061,
	"IN 18th DIV": 1062,
	"IN Cavalry #4 #5": 1063,
	"IN Cavalry #4": 1063,
	"IN Cavalry #5": 1063,
	"RU DIV #15 #16 #17": 1064,
	"RU DIV #15": 1064,
	"RU DIV #16": 1064,
	"RU DIV #17": 1064,
	"W.W.Pt. token": 1065,
	"J By C token": 1066,
	"RU VII Caucasian": 1067,
	"RU Caucasian Cav": 1068,
	"RU Elite DIV #6 #7": 1069,
	"RU Elite DIV #6": 1069,
	"RU Elite DIV #7": 1069,
	"IN 3rd Corps": 1070,
	"IN Elite DIV #3": 1071,
	"IN Cavalry #6": 1072,
	"FR Army Orient 2": 1073,
	"FR DIV #5 #6": 1074,
	"FR DIV #5": 1074,
	"FR DIV #6": 1074,
	"FR D'Esperey HQ": 1075,
	"BR XX Corps": 1076,
	"BR XXI Corps": 1077,
	"BR DIV #5 #6": 1078,
	"BR DIV #5": 1078,
	"BR DIV #6": 1078,
	"BR Cavalry #3": 1079,
	"ANZ Cavalry #3": 1080,
	"BR Allenby HQ": 1081,
	"BR ANA Arab": 1082,
	"ANZ Desert Corps": 1083,
	"BR DIV #7": 1084,
	"BR Cavalry #4": 1085,
	"AP Removed Box": 1086,
	"AP Permanently Eliminated Box": 1087,
	"Trench": 1124,
	"TU-A DIV #10": 1102,
	"TU Elite DIV #9 #10": 1103,
	"TU Elite DIV #9": 1103,
	"TU Elite DIV #10": 1103,
	"TU Cavalry #5": 1104,
	"TU-A DIV #11 #12 #13 #14": 1105,
	"TU-A DIV #11": 1105,
	"TU-A DIV #12": 1105,
	"TU-A DIV #13": 1105,
	"TU-A DIV #14": 1105,
	"CP Air Superiority token": 1106,
	"U_boats in the Med token": 1107,
	"PE Uprising": 1108,
	"Persian Uprising token": 1109,
	"TU DIV #13 #14 #15 #16 #17": 1110,
	"TU DIV #13": 1110,
	"TU DIV #14": 1110,
	"TU DIV #15": 1110,
	"TU DIV #16": 1110,
	"TU DIV #17": 1110,
	"TU Cavalry #6": 1111,
	"TU XIV Corps": 1112,
	"TU XV Corps": 1113,
	"TU XVI Corps": 1114,
	"TU XVII Corps": 1115,
	"TU-A XVIII Corps": 1116,
	"TU DIV #18": 1117,
	"TU-A DIV #15": 1118,
	"BU 4 Army": 1119,
	"Parvus to Berlin token": 1120,
	"Revolution token": 1121,
	"Long Live the Czar! token": 1122,
	"TU-A DIV #16 #17 #18 #19": 1123,
	"TU-A DIV #16": 1123,
	"TU-A DIV #17": 1123,
	"TU-A DIV #18": 1123,
	"TU-A DIV #19": 1123,
	"TU Army Islam HQ": 1125,
	"GE Yildrim #1 #2 #3": 1126,
	"GE Yildrim #1": 1126,
	"GE Yildrim #2": 1126,
	"GE Yildrim #3": 1126,
	"BB.RR token": 1127,
	"TU XX Corps": 1128,
	"TU XXII Corps": 1129,
	"TU-A Left Wing Gp": 1130,
	"TU-A DIV #20": 1131,
	"TU 1 Caucasian": 1132,
	"TU 2 Caucasian": 1133,
	"Afghan Uprising #1 #2 #3": 1134,
	"Afghan Uprising #1": 1134,
	"Afghan Uprising #2": 1134,
	"Afghan Uprising #3": 1134,
	"CAsia Uprising": 1135,
	"Egypt Rebel #1 #2 #3": 1136,
	"Egypt Rebel #1": 1136,
	"Egypt Rebel #2": 1136,
	"Egypt Rebel #3": 1136,
	"Indian Mutiny #1 #2 #3": 1137,
	"Indian Mutiny #1": 1137,
	"Indian Mutiny #2": 1137,
	"Indian Mutiny #3": 1137,
	"Arm Transcas #1 #2 #3": 1138,
	"Arm Transcas #1": 1138,
	"Arm Transcas #2": 1138,
	"Arm Transcas #3": 1138,
	"Geo Transcaucasian #1 #2": 1139,
	"Geo Transcaucasian #1": 1139,
	"Geo Transcaucasian #2": 1139,
	"GE GeoProtect": 1140,
	"Baku Uprising token": 1141,
	"C.Asia Uprising token": 1142,
	"Enzeli Uprising token": 1143,
	"CP Removed Box": 1144,
	"CP Permanently Eliminated Box": 1145,
	"AP MO RU": 1146,
	"AP MO No Attack": 1147,
	"AP MO BR/IN/ANZ": 1148,
	"AP MO Meso/Persia": 1149,
	"AP MO None": 1150,
	"AP MO Balkans": 1151,
	"AP MO Egypt": 1152,
	"AP MO Made": 1153,
	"APMO+0": 1154,
	"APMO+1": 1155,
	"APMO+2": 1156,
	"APMO+3": 1157,
	"APMO+4": 1158,
	"CP MO RU": 1159,
	"CP MO BR/IN/ANZ": 1160,
	"CP MO TU": 1161,
	"CP MO Enver": 1162,
	"CP MO None": 1163,
	"GR 0": 1164,
	"GR 1": 1165,
	"GR 2": 1166,
	"GR 3": 1167,
	"GR 4": 1168,
	"GR 5": 1169,
	"GR 6": 1170,
	"GR 7": 1171,
	"GR 8": 1172,
	"GR 9": 1173,
	"GR 10": 1174,
	"GR 11": 1175,
	"GR 12": 1176,
	"GR 13": 1177,
	"GR 14": 1178,
	"GR 15": 1179,
	"GR 16": 1180,
	"GR 17": 1181,
	"GR 18": 1182,
	"GR 19": 1183,
	"GR 20": 1184,
	"GR 21": 1185,
	"GR 22": 1186,
	"GR 23": 1187,
	"GR 24": 1188,
	"GR 25": 1189,
	"GR 26": 1190,
	"GR 27": 1191,
	"GR 28": 1192,
	"GR 29": 1193,
	"GR 30": 1194,
	"GR 31": 1195,
	"GR 32": 1196,
	"GR 33": 1197,
	"GR 34": 1198,
	"GR 35": 1199,
	"GR 36": 1200,
	"GR 37": 1201,
	"GR 38": 1202,
	"GR 39": 1203,
	"GR 40": 1204,
	"RU Rev": 1205,
	"RU Rev1": 1206,
	"RU Rev2": 1207,
	"RU Rev3": 1208,
	"RU Rev4": 1209,
	"Turn 1": 1210,
	"Turn 2": 1211,
	"Turn 3": 1212,
	"Turn 4": 1213,
	"Turn 5": 1214,
	"Turn 6": 1215,
	"Turn 7": 1216,
	"Turn 8": 1217,
	"Turn 9": 1218,
	"Turn 10": 1219,
	"Turn 11": 1220,
	"Turn 12": 1221,
	"Turn 13": 1222,
	"Turn 14": 1223,
	"Turn 15": 1224,
	"Turn 16": 1225,
	"Turn 17": 1226,
	"neutral_gr_UI": 1227,
	"neutral_bu_UI": 1228,
	"neutral_ro_UI": 1229,
	"LCU_limit_AP1": 1230,
	"LCU_limit_AP2": 1231,
	"LCU_limit_AP3": 1232,
	"LCU_limit_CP1": 1233,
	"LCU_limit_CP2": 1234,
	"LCU_limit_CP3": 1235,
	"C.Asia_Revolt": 1236,
	"Afghan_Alliance": 1237,
	"Indian_Mutiny": 1238,
	"Persian_Neutrality": 1239,
	"CP Air Superiority": 1240,
	"GE RPs TO TU": 1241,
	"BR RPs TO RU": 1242,
	"AP Air Superiority": 1243,
	"RU Amphib Assault Allowed": 1244,
	"Cyprus Allowed": 1245,
	"Egypt Uprising": 1246,
	"Sinai Railroad": 1247,
	"neutral_SB_UI": 1248,
	"SUB IN THE MED": 1249,
	"BB.RR": 1250,
	"box_cp_corps_assets_tu_lcu": 1251,
	"box_cp_corps_assets_tua_lcu": 1252,
	"box_cp_reserve_tu_scu": 1253,
	"box_cp_reserve_tua_scu": 1254,
	"box_cp_reserve_bu_scu": 1255,
	"box_cp_reserve_ge_scu": 1256,
	"box_cp_reserve_ah_scu": 1257,
	"box_cp_reserve_minor_scu": 1258,
	"box_cp_eliminated_tu_lcu": 1259,
	"box_cp_eliminated_tu_scu": 1260,
	"box_cp_eliminated_tua_lcu": 1261,
	"box_cp_eliminated_tua_scu": 1262,
	"box_cp_eliminated_bu_lcu": 1263,
	"box_cp_eliminated_bu_scu": 1264,
	"box_cp_eliminated_ge_lcu": 1265,
	"box_cp_eliminated_ge_scu": 1266,
	"box_cp_eliminated_ah_lcu": 1267,
	"box_cp_eliminated_ah_scu": 1268,
	"box_cp_eliminated_minor": 1269,
	"box_cp_eliminated_tr": 1270,
	"box_ap_corps_assets_ru_lcu": 1271,
	"box_ap_corps_assets_br_lcu": 1272,
	"box_ap_corps_assets_in_lcu": 1273,
	"box_ap_corps_assets_fr_lcu": 1274,
	"box_ap_corps_assets_anz_lcu": 1275,
	"box_ap_reserve_ru_scu": 1276,
	"box_ap_reserve_br_scu": 1277,
	"box_ap_reserve_in_scu": 1278,
	"box_ap_reserve_anz_scu": 1279,
	"box_ap_reserve_sb_scu": 1280,
	"box_ap_reserve_ro_scu": 1281,
	"box_ap_reserve_fr_scu": 1282,
	"box_ap_reserve_other_scu": 1283,
	"box_ap_reserve_beachhead": 1284,
	"box_ap_eliminated_ru_lcu": 1285,
	"box_ap_eliminated_ru_scu": 1286,
	"box_ap_eliminated_br_lcu": 1287,
	"box_ap_eliminated_br_scu": 1288,
	"box_ap_eliminated_anz_lcu": 1289,
	"box_ap_eliminated_anz_scu": 1290,
	"box_ap_eliminated_in_lcu": 1291,
	"box_ap_eliminated_in_scu": 1292,
	"box_ap_eliminated_sb_lcu": 1293,
	"box_ap_eliminated_sb_scu": 1294,
	"box_ap_eliminated_fr_lcu": 1295,
	"box_ap_eliminated_fr_scu": 1296,
	"box_ap_eliminated_ro_lcu": 1297,
	"box_ap_eliminated_ro_scu": 1298,
	"box_ap_eliminated_other": 1299,
	"INDIA_control": 1300,
	"CENTRAL_ASIA_control": 1301
}

if (typeof module === 'object') {
	module.exports = data
}
