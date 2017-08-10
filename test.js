var Datagram = require('./datagram');

function pkg_compare(pkg, obj) {
	pkg2 = new Buffer(Datagram.build(obj), 'binary').toString('hex')
	if (pkg != pkg2) {
		console.log(pkg)
		console.log(pkg2)
		throw new Error('not equal')
	}
}

heartbeat_pkg = 'ea61ea6001001500000000000000057b6aea62ea63'
heartbeat_obj = {
	'type': Datagram.type.Heartbeat,
	'data': '\x7b',
}
pkg_compare(heartbeat_pkg, heartbeat_obj)

heartbeat_ack_pkg = 'ea61ea6001001500000000000100058494ea62ea63'
heartbeat_ack_obj = {
	'type': Datagram.type.Heartbeat_Ack,
	'data': '\x84',
}
pkg_compare(heartbeat_ack_pkg, heartbeat_ack_obj)

login_pkg = 'ea61ea6001002e000000000500001e000579696e646c001132343332353335363635383737363938376fea62ea63'
login_obj = {
	'type': Datagram.type.Login,
	'data': {
		'usr': 'yindl',
		'psw': '24325356658776987',
	},
}
pkg_compare(login_pkg, login_obj)

login_ack_pkg = 'ea61ea6001001500000000050100050015ea62ea63'
login_ack_obj = {
	'type': Datagram.type.Login_Ack,
	'data': '\x00',
}
pkg_compare(login_ack_pkg, login_ack_obj)

init_knx_telegram_pkg = 'ea61ea6001002100000000060300110000000000000000000000000034ea62ea63'
init_knx_telegram_obj = {
	'type': Datagram.type.Init_KNX_Telegram,
	'data': '\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00',
}
pkg_compare(init_knx_telegram_pkg, init_knx_telegram_obj)

// knx_telegram_event_pkg = 'ea61ea60010032000000000606002200000000000000020000000d0f0004004000000000000e0f00040000000050ea62ea63'
// knx_telegram_event_obj = {
// 	'type': Datagram.type.KNX_Telegram_Event,
// 	'data': {
// 		'knx_list': [
// 			'\x00\x00\x00\x0d\x0f\x00\x04\x00\x40\x00\x00',
// 			'\x00\x00\x00\x0e\x0f\x00\x04\x00\x00\x00\x00',
// 		]
// 	}
// }
// pkg_compare(knx_telegram_event_pkg, knx_telegram_event_obj)
