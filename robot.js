var USB = require("./usb.js").USB
var mini = require("./mini").mini

// minicom -D /dev/ttyACM0 -b 9600

// liste des séquences de séquences de commandes à exécuter
// liste normalement envoyées par l'IHM sur le WS
// ces commandes seront exécutées en séquence
var commandes = [ 

	// on positionne le servo et on avance jusqu'à ce qu'un obstacle soit trop proche
	["avancer_jusqu_a_obstacle", "servo=",180, "ml=",150, "mr=",150, "dist<",100, "timeout=",3000],

	// on tourne si l'obstacle est trop proche
	//["avancer_si_obstacle", "ml=",200, "mr=",-200, "dist<",100, "timeout=",500],

	// on tourne
	["avancer", "ml=",200, "mr=",200, "timeout=",500],
	["reculer", "ml=",200, "mr=",200, "timeout=",500],
	["tourne_a_gauche", "ml=",200, "mr=",200, "timeout=",500],
	["tourne_a_droite", "ml=",200, "mr=",200, "timeout=",500],

]

// lancement de go normalement effectué si une liste de commandes arrive sur le WS
setTimeout(() => {
	go()
}, 3000)

var etat = {
	exec : 0,	// pas d'exécution en cours
}

var xbee = new USB("/dev/ttyACM0",{callback : 
	function (s) {
			 if (s.startsWith("{")) {
				var o = JSON.parse(s)
				if (typeof o.mm !== 'undefined') {
					console.log("servo = "+o.servo+" mm = "+o.mm+ " rate = "+o.rate
						+ " mr = "+o.mr+" ml = "+o.ml+" exec = "+o.exec)
					etat = o // état courant (capteurs, ...)
					// l'état courant devrait être envoyé sur le WS
					// pour affichage dans l'IHM

					go()
				}
				if (typeof o.v1 !== 'undefined') {
					console.log("v1 = "+o.v1+" v2 = "+o.v2+ " v3 = "+o.v3+ " v4 = "+o.v4+ " v5 = "+o.v5)
				}
		   }
			 else {
				console.log("XBEE : "+s)
			 }
	}

})


// on exécute la première commande de "commandes"
// s'il n'y a pas une exécution en cours sur l'Arduino
function go() {
	// setTimeout(() => {
	// 	go()	
	// }, 200)

	
	if (commandes.length == 0) return; // toutes les commandes ont été exécutées
	if (etat.exec == 1) return; // exécution en cours sur l'Arduino, on ne fait rien

	etat.exec = 1		// commande en cours d'éxécution
	var cmd = commandes[0]	// extraction 1ere commande
	commandes = commandes.slice(1) // suppression 1ere commande

	if (cmd[0] == "avancer_jusqu_a_obstacle") {
		console.log("avancer_jusqu_a_obstacle")
		avancer_jusqu_a_obstacle(cmd[1],cmd[2],cmd[3],cmd[4],cmd[5],cmd[6],
			cmd[7],cmd[8],cmd[9],cmd[10])
	}
	else if (cmd[0] == "avancer") {
		console.log("avancer")
		avancer(cmd[1],cmd[2],cmd[3],cmd[4],cmd[5],cmd[6])
	}
	else if (cmd[0] == "servo") {
		console.log("servo")
		servo(cmd[1])
	}
		else if (cmd[0] == "reculer") {
		console.log("reculer")
		avancer(cmd[1],cmd[2],cmd[3],cmd[4],cmd[5],cmd[6])
	}
	else if (cmd[0] == "tourne_a_gauche") {
		console.log("tourne_a_gauche")
		avancer(cmd[1],cmd[2],cmd[3],cmd[4],cmd[5],cmd[6])
	}
	else if (cmd[0] == "tourne_a_droite") {
		console.log("tourne_a_droite")
		avancer(cmd[1],cmd[2],cmd[3],cmd[4],cmd[5],cmd[6])
	}

	
}

function avancer_jusqu_a_obstacle(zservo,servo,zml,ml, zmr,mr, zdistmax,distmax, ztimeout,timeout) {
	// servo : position servo
	// ml : vitesse gauche
	// mr : vitesse droite
	// distmax : distance obstacle
	// timeout : durée max de la commande
	// avancer à la vitesse ml/mr pendant timeout ms
	// arrêt si obstacle à moins de distmax mm
	var cmd = "[don]" +
		"[s "+servo+"]" +
		"[dist]" + // 1ere mesure souvent fausse
		"[v1 = time]" + // temps courant en ms dans v1
		"[v1 += "+timeout+"]" + // temps limite pour arrêt exécution
		"[:b0]" +
		"[w 200]" +	// attente 200 ms
		"[dist]" +	// mesure de distance
		"[pdist]" +	// envoi de l'état sur XBee (distance, ...)
		"[if mm < "+distmax+" b2]" + // arrêt si dist < distmax
		"[if time > v1 b2]" + // arrêt si temps limite dépassé
		"[ml "+ml+"]" + // moteur gauche
		"[mr "+mr+"]" + // moteur droit
		"[g b0]" +
		"[:b2]" +
		"[ml 0]" +
		"[mr 0]" +
		"[w 1000]" + // on attend que les moteurs s'arrêtent
		"[dist]" + // mesure de distance
		"[fx]" + // pour signaler la fin d'exécution (variable exec mise à 0)
		"[pdist]" // envoi de l'état (distance, valeur de exec, ...)
	console.log("len cmd = "+cmd.length)
	xbee.port.write("zzz"+cmd+"\n")
	// le zzz réinitialise l'Arduino
}

function avancer(zml,ml, zmr,mr, ztimeout,timeout) {
	// ml : vitesse gauche
	// mr : vitesse droite
	// timeout : durée max de la commande
	// avancer à la vitesse ml/mr pendant timeout ms
	var cmd = "[don]" +
		"[ml "+ml+"]" +
		"[mr "+mr+"]" +
		"[w "+timeout+"]" +
		"[ml 0]" +
		"[mr 0]" +
		"[fx]" +
		"[dist]" +
		"[pdist]"
	console.log("len cmd = "+cmd.length)
	xbee.port.write("zzz"+cmd+"\n")
	// le zzz réinitialise l'Arduino
}

/*----------------------------------------------------------*/
function reculer(zml,ml, zmr,mr, ztimeout,timeout) {
	avancer(zml,-ml, zmr,-mr, ztimeout,timeout);
}

function reculer(zml,ml, zmr,mr, ztimeout,timeout) {
	avancer(zml,-ml, zmr,-mr, ztimeout,timeout);
}
function tourne_a_gauche(zml,ml, zmr,mr, ztimeout,timeout) {
	avancer(zml,-ml, zmr,mr, ztimeout,timeout);
}
function tourne_a_droite(zml,ml, zmr,mr, ztimeout,timeout) {
	avancer(zml,ml, zmr,-mr, ztimeout,timeout);
}
/*----------------------------------------------------------*/

function servo(pos) {
	var cmd = "[don]" +
		"[s "+pos+"]" +
		"[w 1000]" +
		"[fx]" +
		"[dist]" +
		"[pdist]"
	console.log("len cmd = "+cmd.length)
	xbee.port.write("zzz"+cmd+"\n")
	// le zzz réinitialise l'Arduino
}

function capteurs() {

}




