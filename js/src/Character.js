var Character = (function(Entity, Keyboard, GamepadManager, StateMachine, Graphics) {
	'use strict';

	window.bulletsPool = [];
	function Character(params) {
		// enforces new
		if (!(this instanceof Character)) {
			return new Character(params);
		}
		Entity.apply(this, arguments);

		this.previousX = this.x;
		this.previousY = this.y;

		this.speed = 5000;
		this.xSpeed = 0;
		this.ySpeed = 0;
		this.xForce = 0;
		this.yForce = 1500;
		this.onTheGround = false;
		this.isVulnerable = true;

		this.faceRight = true;
		this.bullets = [];
		this.shootCooldown = 0.25;
		this.shootCooldownValue = 0;
		this.isCooldown = false;

		// ID of the character is also the gamepad ID
		this.id = -1;
		this.flags = [];
		this.joystickVal = 0;
		this.move = {
			x: 0,
			y: 0
		};

		this.sprites = params.sprites;
		this.handleAnim();
	}
	Character.inheritsFrom(Entity);

	// STATIC
	Character.FLAGS = ["idle", "running", "jumping", "shooting", "dead", "canRun", "canJump", "canShoot"];

	Character.prototype.addFlag = function (flag) {
		var index = this.flags.indexOf(flag);
		if (Character.FLAGS.indexOf(flag) == -1 || (index != -1)) {
			return;
		}
		this.flags.push(flag);
	}

	Character.prototype.removeFlag = function (flag) {
		var index = this.flags.indexOf(flag);
		if (index == -1) {
			return;
		}
		this.flags.splice(index, 1);
	}

	Character.prototype.hasFlag = function (flag) {
		return this.flags.indexOf(flag) != -1;
	}

	Character.prototype.takeControl = function (id) {
		this.id = id;
		this.addFlag("canRun");
		this.addFlag("canJump");
		this.addFlag("canShoot");
	}

	Character.prototype.die = function (xPosition) {
		this.isVulnerable = false;
		this.removeFlag("canRun");
		this.removeFlag("canJump");
		this.removeFlag("canShoot");
		this.x = xPosition;
		this.y = -100;

		setTimeout((function() {
			this.addFlag("canRun");
			this.addFlag("canJump");
			this.addFlag("canShoot");
		}).bind(this), 1000);

		var blink = setInterval(function () {
			this.graphics.enabled = !this.graphics.enabled;
		}.bind(this), 150);

		setTimeout((function() {
			clearInterval(blink);
			this.graphics.enabled = true;
			this.isVulnerable = true;
		}).bind(this), 2500);
	}

	Character.prototype.update = function (dt) {
		this.move.x = 0;
		this.move.y = 0;

		// Cooldown
		if (this.isCooldown) {
			this.shootCooldownValue	+= dt;
		}
		if (this.shootCooldownValue >= this.shootCooldown) {
			this.shootCooldownValue = 0;
			this.isCooldown = false;
		}

		if (this.id != -1) {
			this.handleControls(dt);
		}

		this.applyMove(dt);
		this.updatePhysics(dt);
		this.handleAnim();
	}

	Character.prototype.updatePhysics = function (dt) {
		this.previousX = this.x;
		this.previousY = this.y;

		this.x += this.xSpeed * dt + .5 * this.xForce * dt * dt;
		this.y += this.ySpeed * dt + .5 * this.yForce * dt * dt;
	
		this.xSpeed += this.xForce * dt;
		this.ySpeed += this.yForce * dt;
	}

	Character.prototype.handleControls = function (dt) {
		if (this.id == -1) {
			return;
		}

		// Move
		if (this.hasFlag("canRun")) {
			this.removeFlag("running");

			var curJoystickVal = GamepadManager.instance.getController(this.id).gamepad.axes[0];
			var joystickMove = curJoystickVal - this.joystickVal;
			if (GamepadManager.instance.isButtonDown(this.id, GamepadManager.instance.getButtonID("RIGHT"))) {
				++this.move.x;
				this.addFlag("running");
			}

			if (GamepadManager.instance.isButtonDown(this.id, GamepadManager.instance.getButtonID("LEFT"))) {
				--this.move.x;
				this.addFlag("running");
			}

			if (curJoystickVal > 0.5 || curJoystickVal < -0.5) {
				this.addFlag("running");
				this.move.x = curJoystickVal;
			}

			if (this.hasFlag("canJump")) {
				this.removeFlag("jumping");
				if (GamepadManager.instance.isButtonDown(this.id, GamepadManager.instance.getButtonID("A"))) {
					this.jump();
					this.removeFlag("canJump");
					this.addFlag("jumping");
				}
			}
		}

		if (this.hasFlag("canShoot")) {
			this.removeFlag("shooting");
			if (GamepadManager.instance.isButtonDown(this.id, GamepadManager.instance.getButtonID("X"))) {
				this.shoot();
				this.addFlag("shooting");
			}
		}
	}

	Character.prototype.handleAnim = function() {
		var graphics = null;
		var spritesheet = null;
		if (this.hasFlag('running') && !this.hasFlag('jumping')) {
			spritesheet = this.sprites[this.faceRight ? "run_r" : "run_l"];
			if (!this.graphics || this.graphics.spritesheet != spritesheet) {
				this.graphics = new Graphics(this, {
					spritesheet: spritesheet,
					width: 85,
					height: 105,
					localX: -43,
					localY: -20,
					animated: true,
					frameRate: 150,
					totalFrames: 4
				});
			}
		} else if (!this.hasFlag('running') && !this.hasFlag('jumping') && !this.hasFlag('shooting')){
			spritesheet = this.sprites[this.faceRight ? "idle_r" : "idle_l"];
			if (!this.graphics || this.graphics.spritesheet != spritesheet) {
				this.graphics = new Graphics(this, {
					spritesheet: spritesheet,
					localY: -20,
					width: 70,
					height: 105,
				});
			}
		} else if (this.hasFlag('jumping')) {
			spritesheet = this.sprites[this.faceRight ? "jump_r" : "jump_l"];
			if (!this.graphics || this.graphics.spritesheet != spritesheet) {
				this.graphics = new Graphics(this, {
					spritesheet: spritesheet,
					width: 70,
					height: 105
				});
			}
		}
		if (this.hasFlag('shooting')) {
			if (this.onTheGround) {
				if (this.move.x != 0) {
					spritesheet = this.sprites[this.faceRight ? "run_r" : "run_l"];
					if (!this.graphics || this.graphics.spritesheet != spritesheet) {
						this.graphics = new Graphics(this, {
							spritesheet: spritesheet,
							width: 85,
							height: 105,
							localX: -43,
							localY: -20,
							animated: true,
							frameRate: 150,
							totalFrames: 4
						});
					}
				} else {
					spritesheet = this.sprites[this.faceRight ? "idle_r" : "idle_l"];
					if (!this.graphics || this.graphics.spritesheet != spritesheet) {
						this.graphics = new Graphics(this, {
							spritesheet: spritesheet,
							localY: -20,
							width: 70,
							height: 105,
						});
					}
				}
			} else {
				spritesheet = this.sprites[this.faceRight ? "jump_r" : "jump_l"];
				if (!this.graphics || this.graphics.spritesheet != spritesheet) {
					this.graphics = new Graphics(this, {
						spritesheet: spritesheet,
						width: 70,
						height: 105
					});
				}
			}
		}
	}

	Character.prototype.applyMove = function (dt) {
		var diffX = this.move.x * dt * this.speed;

		if (this.move.x > 0) {
			this.faceRight = true;
		} else if (this.move.x < 0) {
			this.faceRight = false;
		}

		if ((this.xSpeed < 0 && this.move.x > 0) || (this.xSpeed > 0 && this.move.x < 0))
			this.xSpeed = 0;

		this.xSpeed += diffX;
		if (this.xSpeed > 500) {
			this.xSpeed = 500;
		}
		if (this.xSpeed < -500) {
			this.xSpeed = -500;
		}
		if (this.move.x == 0) {
			this.xSpeed *= .8 + .1 * dt;
		}
		// this.ySpeed += this.move.y * dt * this.speed;
	}

	Character.prototype.jump = function () {
		this.ySpeed = -800;
	}

	Character.prototype.handleCollision = function (collisionPoint) {
		if (collisionPoint == null) {
			this.onTheGround = false;
			this.removeFlag("canJump");
			return;
		}

		var angle = collisionPoint.angle;
		var tempAngle = Math.atan2(this.previousY - this.y, this.previousX - this.x);

		this.x += Math.cos(angle) * (30 - collisionPoint.dist + (this.onTheGround ? -1 : 0));
		this.y += Math.sin(angle) * (30 - collisionPoint.dist + (this.onTheGround ? -1 : 0));

		angle -= tempAngle - angle;

		var totalSpeed = Math.sqrt(this.xSpeed * this.xSpeed + this.ySpeed * this.ySpeed);
		if (!this.onTheGround)
			totalSpeed *= .2;

		// this.xSpeed = Math.cos(angle) * totalSpeed;
		this.ySpeed = Math.sin(angle) * totalSpeed;

		if (collisionPoint.angle < - Math.PI / 4 && collisionPoint.angle > - 3 * Math.PI / 4) {
			this.addFlag("canJump");
			this.onTheGround = true;
		}
	}

	Character.prototype.shoot = function () {
		if (this.isCooldown) {
			return;
		}
		this.isCooldown = true;
		var bullet = this.getBullet();
		bullet.direction = this.faceRight ? 1 : -1;
		bullet.x = this.x + (this.faceRight ? 50 : -50);
		bullet.y = this.y + 30;
		bullet.init(this.id);
		window.gameActivity._entities.push(bullet);
		window.gameActivity.getScreen().addChild(bullet);
	}

	Character.prototype.getBullet = function () {
		if (window.bulletsPool.length == 0) {
			return new Bullet({
				owner: this.id
			});
		}
		return window.bulletsPool.splice(0, 1)[0];
	}

	return Character;

}(Entity, Keyboard, GamepadManager, StateMachine, Graphics));
