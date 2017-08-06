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
	'type': 'Heartbeat',
	'data': '\x7b',
}
pkg_compare(heartbeat_pkg, heartbeat_obj)

heartbeat_ack_pkg = 'ea61ea6001001500000000000100058494ea62ea63'
heartbeat_ack_obj = {
	'type': 'Heartbeat_Ack',
	'data': '\x84',
}
pkg_compare(heartbeat_ack_pkg, heartbeat_ack_obj)

login_pkg = 'ea61ea6001002e000000000500001e000579696e646c001132343332353335363635383737363938376fea62ea63'
usr = 'yindl'
psw = '24325356658776987'
buf = new Buffer(usr.length + psw.length + 4)
buf.writeUInt16BE(usr.length, 0)
buf.write(usr, 2)
buf.writeUInt16BE(psw.length, usr.length + 2)
buf.write(psw, usr.length + 4)
login_data = buf.toString()
login_obj = {
	'type': 'Login',
	'data': login_data,
}
pkg_compare(login_pkg, login_obj)

login_ack_pkg = 'ea61ea6001001500000000050100050015ea62ea63'
login_ack_obj = {
	'type': 'Login_Ack',
	'data': '\x00',
}
pkg_compare(login_ack_pkg, login_ack_obj)

init_knx_telegram_pkg = 'ea61ea6001002100000000060300110000000000000000000000000034ea62ea63'
init_knx_telegram_obj = {
	'type': 'Init_KNX_Telegram',
	'data': '\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00',
}
pkg_compare(init_knx_telegram_pkg, init_knx_telegram_obj)

// knx_telegram_event_pkg = 'ea61ea60010032000000000606002200000000000000020000000d0f0004004000000000000e0f00040000000050ea62ea63'
// knx_telegram_event_obj = {
// 	'type': 'KNX_Telegram_Event',
// 	'data': {
// 		'count': 0x0002,
// 		'knx_list': [
// 			[0x00, 0x00, 0x00, 0x0d, 0x0f, 0x00, 0x04, 0x00, 0x40, 0x00, 0x00],
// 			[0x00, 0x00, 0x00, 0x0e, 0x0f, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00],
// 		]
// 	}
// }
// pkg_compare(knx_telegram_event_pkg, knx_telegram_event_obj)
