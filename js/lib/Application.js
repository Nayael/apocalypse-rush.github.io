var Application = (function(Stage) {
	'use strict';

	function Application(stage) {
		// enforces new
		if (!(this instanceof Application)) {
			return new Application(stage);
		}

		///////////////////
		// PUBLIC FIELDS //
		///////////////////
		this.mainLoop = null;


		////////////////////
		// PRIVATE FIELDS //
		////////////////////
		this._stage = stage || new Stage(window.innerWidth, window.innerHeight);
		this._activities = [];

		////////////////////
		// PUBLIC METHODS //
		////////////////////
		this.init = function () {
			this.mainLoop = requestAnimationFrame(this.update.bind(this));
		};

		this.addActivity = function (activity) {
			activity.application = this;
			this._activities.push(activity);
			this._stage.pushScreen(activity.getScreen());
		};

		this.removeActivity = function (activity) {
			var index = this._activities.indexOf(activity);
			if (index != -1) {
				this._stage.removeScreen(activity.getScreen());
				this._activities.splice(index, 1);
			}
		};

		this.update = function () {
			this._stage.render();
			for (var i = 0, nbAct = this._activities.length, activity; i < nbAct; ++i) {
				activity = this._activities[i];
				if (!activity.isEnabled()) {
					continue;
				}
				activity.update();
			}

			// Call for update at the next frame
			this.mainLoop = requestAnimationFrame(this.update.bind(this));
		};

		this.getStage = function () {
			return this._stage;
		};
	}

	return Application;
}(Stage));