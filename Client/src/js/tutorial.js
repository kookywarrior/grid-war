import config from "./config.js"

class Tutorial {
	constructor(borderManager, tileManager, handleMessages) {
		this.borderManager = borderManager
		this.tileManager = tileManager
		this.handleMessages = handleMessages
		this.mobileAndTablet = function () {
			let check = false
			;(function (a) {
				if (
					/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
						a
					) ||
					/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
						a.substr(0, 4)
					)
				)
					check = true
			})(navigator.userAgent || navigator.vendor || window.opera)
			return check
		}

		window.VARIABLES.tutorial = true
		if (window.ws) {
			window.ws.close()
		}
		window.sendMovement = () => {}

		this.borderManager.borders = []
		this.tileManager.tiles = []
		window.myId = "me"

		this.step1()
	}

	text(text) {
		const lines = text.split("\n").map((line) => `<span class="tutorialBoxNewLine">${line}</span>`)
		document.getElementById("tutorialBox").innerHTML = lines.join("")
	}

	step1() {
		this.text(
			"Welcome to Grid War!\n" +
				(this.mobileAndTablet() ? "Swipe left, right, up, or down to move the tiles" : "Use the arrow keys or WASD to move the tiles") +
				"\nNow, try moving LEFT"
		)
		window.sendMovement = (direction) => {
			if (direction === "left") {
				this.step2()
			}
		}
		this.handleMessages("addBorder", {
			id: "me",
			name: "me",
			x: config.mapSize / 2,
			y: 1,
			score: 0,
			noUi: true
		})
		this.handleMessages("addTile", {
			sid: 1,
			value: 2,
			x: 1,
			y: 1,
			borderId: "me"
		})
		this.handleMessages("addTile", {
			sid: 2,
			value: 2,
			x: 2,
			y: 2,
			borderId: "me"
		})
		this.handleMessages("addBorder", {
			id: "enemy1",
			name: "enemy1",
			x: config.mapSize / 2 - 6,
			y: 0,
			score: 0
		})
		this.handleMessages("addTile", {
			sid: 101,
			value: 4,
			x: 3,
			y: 0,
			borderId: "enemy1"
		})
		this.handleMessages("addTile", {
			sid: 102,
			value: 2,
			x: 0,
			y: 1,
			borderId: "enemy1"
		})
		this.handleMessages("addTile", {
			sid: 103,
			value: 2,
			x: 3,
			y: 1,
			borderId: "enemy1"
		})
		this.handleMessages("addTile", {
			sid: 104,
			value: 2,
			x: 1,
			y: 3,
			borderId: "enemy1"
		})
		this.handleMessages("addBorder", {
			id: "enemy2",
			name: "enemy2",
			x: config.mapSize / 2 - 10,
			y: 2,
			score: 0
		})
		this.handleMessages("addTile", {
			sid: 201,
			value: 4,
			x: 2,
			y: 0,
			borderId: "enemy2"
		})
		this.handleMessages("addTile", {
			sid: 202,
			value: 2,
			x: 3,
			y: 0,
			borderId: "enemy2"
		})
		this.handleMessages("addTile", {
			sid: 203,
			value: 4,
			x: 2,
			y: 1,
			borderId: "enemy2"
		})
	}

	step2() {
		this.text("The tiles all moved in the same direction, and a new tile appeared\nTry moving UP to bring 2 and 2 together")
		window.sendMovement = (direction) => {
			if (direction === "top") {
				this.step3()
			}
		}
		this.handleMessages("slideBorder", {
			id: "me",
			x: config.mapSize / 2 - 1,
			y: 1
		})
		this.handleMessages("slideTile", {
			sid: 1,
			x: 0,
			y: 1
		})
		this.handleMessages("slideTile", {
			sid: 2,
			x: 0,
			y: 2
		})
		this.handleMessages("showTile", {
			sid: 3,
			value: 2,
			x: 1,
			y: 2,
			borderId: "me"
		})
	}

	step3() {
		this.text("Tiles with the same number combine when they collide, 2 + 2 = 4\nNow, move LEFT")
		window.sendMovement = (direction) => {
			if (direction === "left") {
				this.step4()
			}
		}
		this.handleMessages("slideBorder", {
			id: "me",
			x: config.mapSize / 2 - 1,
			y: 0
		})
		this.handleMessages("mergeTile", {
			sid1: 1,
			sid2: 2,
			merge: 4,
			value: 4,
			x: 0,
			y: 0,
			borderId: "me"
		})
		this.handleMessages("slideTile", {
			sid: 3,
			x: 1,
			y: 0
		})
		this.handleMessages("showTile", {
			sid: 5,
			value: 2,
			x: 0,
			y: 3,
			borderId: "me"
		})
	}

	step4() {
		this.text("If no tiles can move or combine, your board will shake to show that the move is invalid\nNow, move UP")
		window.sendMovement = (direction) => {
			if (direction === "top") {
				this.step5()
			}
		}
		this.handleMessages("invalidMove", {
			direction: "left"
		})
	}

	step5() {
		this.text(
			"If your board cannot move, it will stay in place\nHowever, the tiles will continue moving or combining as long as it is not an invalid move\nNow, move LEFT"
		)
		window.sendMovement = (direction) => {
			if (direction === "left") {
				this.step6()
			}
		}
		this.handleMessages("slideTile", {
			sid: 5,
			x: 0,
			y: 1
		})
		this.handleMessages("showTile", {
			sid: 6,
			value: 2,
			x: 3,
			y: 1,
			borderId: "me"
		})
	}

	step6() {
		this.text("When the enemy's board is beside you, you can try to destroy the board by making a successful collision with it!\nNow, move LEFT")
		window.sendMovement = (direction) => {
			if (direction === "left") {
				this.step7()
			}
		}
		this.handleMessages("slideBorder", {
			id: "me",
			x: config.mapSize / 2 - 2,
			y: 0
		})
		this.handleMessages("mergeTile", {
			sid1: 5,
			sid2: 6,
			merge: 7,
			value: 4,
			x: 0,
			y: 1,
			borderId: "me"
		})
		this.handleMessages("showTile", {
			sid: 8,
			value: 2,
			x: 3,
			y: 0,
			borderId: "me"
		})
	}

	step7() {
		this.text(
			"Your collision with the enemy's board was unsuccessful because the tiles that meet each other must have a higher value on your side than on the enemy's side\nNow, try making an 8 by moving LEFT"
		)
		window.sendMovement = (direction) => {
			if (direction === "left") {
				this.step8()
			}
		}
		this.handleMessages("mergeTile", {
			sid1: 3,
			sid2: 8,
			merge: 9,
			value: 4,
			x: 1,
			y: 0,
			borderId: "me"
		})
		this.handleMessages("showTile", {
			sid: 10,
			value: 2,
			x: 0,
			y: 3,
			borderId: "me"
		})
	}

	step8() {
		this.text("Now, you should be able to destroy the enemy's board\nMove LEFT")
		window.sendMovement = (direction) => {
			if (direction === "left") {
				this.step9()
			}
		}
		this.handleMessages("mergeTile", {
			sid1: 4,
			sid2: 9,
			merge: 11,
			value: 8,
			x: 0,
			y: 0,
			borderId: "me"
		})
		this.handleMessages("showTile", {
			sid: 12,
			value: 2,
			x: 3,
			y: 0,
			borderId: "me"
		})
	}

	step9() {
		this.text("Boom! You have successfully destroyed it\nNow, move LEFT to try to get near the next enemy's board")
		window.sendMovement = (direction) => {
			if (direction === "left") {
				this.step10()
			}
		}
		this.handleMessages("removeTile", {
			sid: 101
		})
		this.handleMessages("removeTile", {
			sid: 102
		})
		this.handleMessages("removeTile", {
			sid: 103
		})
		this.handleMessages("removeTile", {
			sid: 104
		})
		this.handleMessages("removeBorder", {
			id: "enemy1"
		})
		this.handleMessages("slideBorder", {
			id: "me",
			x: config.mapSize / 2 - 3,
			y: 0
		})
		this.handleMessages("slideTile", {
			sid: 12,
			x: 1,
			y: 0
		})
		this.handleMessages("showTile", {
			sid: 13,
			value: 2,
			x: 2,
			y: 1,
			borderId: "me"
		})
	}

	step10() {
		this.text("Move LEFT to try to get near the next enemy's board")
		window.sendMovement = (direction) => {
			if (direction === "left") {
				this.step11()
			}
		}
		this.handleMessages("slideBorder", {
			id: "me",
			x: config.mapSize / 2 - 4,
			y: 0
		})
		this.handleMessages("slideTile", {
			sid: 13,
			x: 1,
			y: 1
		})
		this.handleMessages("showTile", {
			sid: 14,
			value: 2,
			x: 3,
			y: 0,
			borderId: "me"
		})
	}

	step11() {
		this.text("Move LEFT to try to get near the next enemy's board")
		window.sendMovement = (direction) => {
			if (direction === "left") {
				this.step12()
			}
		}
		this.handleMessages("slideBorder", {
			id: "me",
			x: config.mapSize / 2 - 5,
			y: 0
		})
		this.handleMessages("mergeTile", {
			sid1: 12,
			sid2: 14,
			merge: 15,
			value: 4,
			x: 1,
			y: 0,
			borderId: "me"
		})
		this.handleMessages("showTile", {
			sid: 16,
			value: 4,
			x: 3,
			y: 3,
			borderId: "me"
		})
	}

	step12() {
		this.text("Move LEFT to try colliding with the next enemy's board")
		window.sendMovement = (direction) => {
			if (direction === "left") {
				this.step13()
			}
		}
		this.handleMessages("slideBorder", {
			id: "me",
			x: config.mapSize / 2 - 6,
			y: 0
		})
		this.handleMessages("slideTile", {
			sid: 16,
			x: 1,
			y: 3
		})
		this.handleMessages("showTile", {
			sid: 17,
			value: 2,
			x: 3,
			y: 1,
			borderId: "me"
		})
	}

	step13() {
		this.text(
			"Your collision with the enemy's board was unsuccessful because at least one tile from each side must meet at the edge of the board\nNow, move DOWN"
		)
		window.sendMovement = (direction) => {
			if (direction === "bottom") {
				this.step14()
			}
		}
		this.handleMessages("mergeTile", {
			sid1: 13,
			sid2: 17,
			merge: 18,
			value: 4,
			x: 1,
			y: 1,
			borderId: "me"
		})
		this.handleMessages("showTile", {
			sid: 19,
			value: 2,
			x: 3,
			y: 3,
			borderId: "me"
		})
	}

	step14() {
		this.text("Now, 2 from the enemy's board and 8 from your board meet\nMove LEFT to destroy it")
		window.sendMovement = (direction) => {
			if (direction === "left") {
				this.step15()
			}
		}
		this.handleMessages("slideBorder", {
			id: "me",
			x: config.mapSize / 2 - 6,
			y: 1
		})
		this.handleMessages("slideTile", {
			sid: 11,
			x: 0,
			y: 1
		})
		this.handleMessages("slideTile", {
			sid: 7,
			x: 0,
			y: 2
		})
		this.handleMessages("slideTile", {
			sid: 15,
			x: 1,
			y: 2
		})
		this.handleMessages("mergeTile", {
			sid1: 16,
			sid2: 18,
			merge: 20,
			value: 8,
			x: 1,
			y: 3,
			borderId: "me"
		})
		this.handleMessages("showTile", {
			sid: 21,
			value: 2,
			x: 3,
			y: 2,
			borderId: "me"
		})
	}

	step15() {
		this.text(
			"Boom! You have successfully destroyed it\nNow, get ready for action in Grid War!\n" +
				(this.mobileAndTablet() ? "Tap anywhere to continue..." : "Press any key to continue...")
		)
		this.handleMessages("removeTile", {
			sid: 201
		})
		this.handleMessages("removeTile", {
			sid: 202
		})
		this.handleMessages("removeTile", {
			sid: 203
		})
		this.handleMessages("removeBorder", {
			id: "enemy2"
		})
		this.handleMessages("slideBorder", {
			id: "me",
			x: config.mapSize / 2 - 7,
			y: 1
		})
		this.handleMessages("slideTile", {
			sid: 19,
			x: 2,
			y: 3
		})
		this.handleMessages("slideTile", {
			sid: 21,
			x: 1,
			y: 2
		})
		this.handleMessages("mergeTile", {
			sid1: 7,
			sid2: 15,
			merge: 22,
			value: 8,
			x: 0,
			y: 2,
			borderId: "me"
		})
		this.handleMessages("showTile", {
			sid: 23,
			value: 2,
			x: 0,
			y: 0,
			borderId: "me"
		})
		window.onkeydown = (event) => {
			window.location.reload()
		}
		window.ontouchstart = (event) => {
			window.location.reload()
		}
	}
}

export default Tutorial
