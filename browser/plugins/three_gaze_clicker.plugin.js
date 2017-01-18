(function() {
	var ThreeGazeClicker = E2.plugins.three_gaze_clicker = function(core) {
		this.desc = 'Gaze Clicker'
		Plugin.apply(this, arguments)

		this.core = core

		this.iconDistance = 0.030

		this.input_slots = [
			{name: 'camera', dt: core.datatypes.CAMERA},
			{name: 'scene', dt: core.datatypes.SCENE}
		]

		this.output_slots = [
			{name: 'scene', dt: core.datatypes.SCENE},
			{name: 'object', dt: core.datatypes.OBJECT3D}
		]

		this.always_update = true
	}

	ThreeGazeClicker.prototype = Object.create(Plugin.prototype)

	ThreeGazeClicker.prototype.reset = function() {
	}

	ThreeGazeClicker.prototype.play = function() {
		this.input.setSize(E2.core.renderer.getSize())
	}

	ThreeGazeClicker.prototype.update_input = function(slot, data) {
		switch (slot.index) {
			case 0: // camera
				this.camera = data
				break
			case 1: // scene
				this.scene = data
				break
			default:
				break
		}

	}

	ThreeGazeClicker.prototype.update_output = function(slot) {
		if (slot.index === 0) {
			return this.scene
		}
		else if (slot.index === 1) {
			return this.lastObj
		}
	}

	ThreeGazeClicker.prototype.setupRay = function() {
		var el = document.body

		if (!this.camera)
			this.camera = E2.app.player.vrControlCamera

		this.input = new RayInput.default(this.camera, E2.core.renderer.domElement)
		this.input.setSize(E2.core.renderer.getSize())

		this.input.on('raydown', function(mesh) {
			if (!mesh || E2.app.worldEditor.isActive())
				return;

			this.lastObj = mesh
			E2.core.runtimeEvents.emit('gazeClicked:'+mesh.uuid)
		})

		this.input.on('rayover', function(mesh) {
			if (!mesh || E2.app.worldEditor.isActive())
				return;

			el.style.cursor = 'pointer'

			this.lastObj = mesh
			E2.core.runtimeEvents.emit('gazeIn:'+mesh.uuid)
		})

		this.input.on('rayout', function(mesh) {
			if (!mesh || E2.app.worldEditor.isActive())
				return;

			el.style.cursor = ''

			this.lastObj = mesh
			E2.core.runtimeEvents.emit('gazeOut:'+mesh.uuid)
		})

		this.object3d = this.input.getMesh()

		E2.app.player.rayInput = this.input
	}

	ThreeGazeClicker.prototype.state_changed = function(ui) {
		if (ui)
			return

		this.setupRay()

		E2.core.on('resize', function(evt) {
			E2.app.player.rayInput.setSize(evt)
		})
	}

	ThreeGazeClicker.prototype.update_state = function() {
		if (!this.scene || !this.camera) {
			return
		}

		if (this.scene.hasClickableObjects && this.showIcon !== false) {
			this.input.update()

			if (this.scene.children[1].children.indexOf(this.object3d) < 0) {
				this.scene.children[1].add(this.object3d)
			}
		}
		else {
			if (this.scene.children[1].children.indexOf(this.object3d) >= 0) {
				this.scene.children[1].remove(this.object3d)
			}
		}
	}

})()