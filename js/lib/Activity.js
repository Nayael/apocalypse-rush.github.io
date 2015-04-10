var Activity = (function(Screen) {
	'use strict';

	function Activity(existingEntities) {
		// enforces new
		if (!(this instanceof Activity)) {
			return new Activity(existingEntities);
		}
		
        ///////////////////////
        // PUBLIC ATTRIBUTES //
        ///////////////////////
        this.application = null;

        ////////////////////////
        // PRIVATE ATTRIBUTES //
        ////////////////////////
		this._entities = (existingEntities && (existingEntities instanceof Array) && existingEntities.length > 0) ? existingEntities : [];
		this._screen = new Screen(this, this._entities);
		this._enabled = true;


        ////////////////////////////////////////////////////////
        // PUBLIC METHODS (with access to private attributes) //
        ////////////////////////////////////////////////////////
	    /**
	     * Update the activity
	     */
		this.update = function() {
			if (!this._enabled) {
				return;
			}

			for (var i = 0, nbEnt = this._entities.length, ent; i < nbEnt; ++i) {
				ent = this._entities[i];
				if (ent && ent.update) {
					ent.update();
				}
			}
		};

		this.getScreen = function () {
			return this._screen;
		};

		this.setEnabled = function (value) {
			this._enabled = value;
		};

		this.isEnabled = function () {
			return this._enabled;
		};
	}
	return Activity;

}(Screen));